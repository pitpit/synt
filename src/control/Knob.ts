import Konva from 'konva';
import Mod from '../core/Mod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import ControlSignal from '../core/ControlSignal';

export default class Knob extends Mod {
  range: number = 400;

  /** Value change per pixel for touch (0.05 = 20 px covers 0→1). */
  touchSensitivity: number = 0.005;

  /** Wheel scaling factor (pos units per normalised-delta pixel). */
  wheelSensitivity: number = 0.5;

  value: number = 0.5;

  /** Accumulated rotation position in the range [-range, +range], shared between wheel and touch handlers. */
  pos: number = 0;

  group: Konva.Group|null = null;

  centerX: number = 0;

  centerY: number = 0;

  innerCircle: Konva.Circle|null = null;

  pinCircle: Konva.Circle|null = null;

  constructor() {
    super();
    this.configure([PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.CTRLOUT], 'knob');
  }

  private addWheelListener(_: Konva.Group) {
    if (!this.innerCircle) return;
    this.innerCircle.on('wheel', (e) => {
      // Stop the event from reaching the stage zoom handler
      e.cancelBubble = true;
      const event = e.evt;
      // Normalize across deltaMode: 0=pixels, 1=lines (~16px each), 2=pages
      const normalizedDelta = event.deltaMode === 1
        ? event.deltaY * 16
        : event.deltaY;
      this.pos -= normalizedDelta * this.wheelSensitivity;
      if (this.pos < -this.range) {
        this.pos = -this.range;
      } else if (this.pos > this.range) {
        this.pos = this.range;
      }
      event.preventDefault();
      this.value = ((this.pos + this.range) / this.range) * 0.5;
      this.updatePinCirclePosition();
      this.pushOutput(PlugPosition.WEST, new ControlSignal(this.value));
    });
  }

  private addTouchListener(group: Konva.Group) {
    if (!this.innerCircle) return;

    this.innerCircle.on('touchstart', (e) => {
      if (e.evt.touches.length !== 1) return;
      // Capture touch: prevent stage pan and mod drag
      e.cancelBubble = true;
      group.draggable(false);

      const touch = e.evt.touches[0];
      const touchId = touch.identifier;
      const startY = touch.clientY;
      const startValue = this.value;

      // Use native window listeners so the swipe keeps working even when
      // the finger moves outside the innerCircle bounds.
      const onMove = (moveEvt: TouchEvent) => {
        const t = Array.from(moveEvt.changedTouches).find((ct) => ct.identifier === touchId);
        if (!t) return;
        moveEvt.preventDefault();
        const dy = startY - t.clientY;
        this.value = Math.max(0, Math.min(1, startValue + dy * this.touchSensitivity));
        this.pos = this.range * (2 * this.value - 1);
        this.updatePinCirclePosition();
        this.pushOutput(PlugPosition.WEST, new ControlSignal(this.value));
      };

      const onEnd = (endEvt: TouchEvent) => {
        const t = Array.from(endEvt.changedTouches).find((ct) => ct.identifier === touchId);
        if (!t) return;
        group.draggable(true);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
      };

      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onEnd);
    });
  }

  private drawKnob(group:Konva.Group) {
    const circle = new Konva.Circle({
      x: this.centerX,
      y: this.centerY,
      radius: 24,
      stroke: 'black',
      strokeWidth: 4,
    });

    this.innerCircle = new Konva.Circle({
      x: this.centerX,
      y: this.centerY,
      radius: 19,
      fill: 'black',
    });

    this.pinCircle = new Konva.Circle({
      radius: 2,
      fill: 'white',
    });

    group.add(circle);
    group.add(this.innerCircle);
    group.add(this.pinCircle);
    this.updatePinCirclePosition();
  }

  /**
   * Draw and redraw the rotating button with the little round indicator
   *  placed arround the button depending on set value.
   */
  private updatePinCirclePosition() {
    if (this.pinCircle) {
      const theta = Math.PI * -((this.value * 270 - 135 - 90) / 180);
      const radius = 10;
      const x = this.centerX + radius * Math.cos(theta);
      const y = this.centerY - radius * Math.sin(theta);
      this.pinCircle.position({
        x,
        y,
      });
      if (this.innerCircle) {
        this.innerCircle.draw();
      }
      this.pinCircle.draw();
    }
  }

  draw(group:Konva.Group) {
    this.centerX = group.width() / 2;
    this.centerY = group.height() / 2;
    this.group = group;

    this.drawKnob(group);
    this.addWheelListener(group);
    this.addTouchListener(group);
  }
}
