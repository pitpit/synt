import Konva from 'konva';
import Mod from '../core/Mod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import ControlSignal from '../core/ControlSignal';

export default class Knob extends Mod {
  range: number = 400;

  sensitivity: number = 0.1;

  value: number = 0.5;

  group: Konva.Group|null = null;

  centerX: number = 0;

  centerY: number = 0;

  innerCircle: Konva.Circle|null = null;

  pinCircle: Konva.Circle|null = null;

  constructor() {
    super();
    this.configure([PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.CTRLOUT], 'knob');
  }

  private addWheelListener(group: Konva.Group) {
    let pos = 0;
    group.on('wheel', (e) => {
      const event = e.evt;
      if (!event.ctrlKey) {
        // Normalize across deltaMode: 0=pixels, 1=lines (~16px each), 2=pages
        const normalizedDelta = event.deltaMode === 1
          ? event.deltaY * 16
          : event.deltaY;
        pos -= normalizedDelta * this.sensitivity;
        if (pos < -this.range) {
          pos = -this.range;
        } else if (pos > this.range) {
          pos = this.range;
        }
      }
      event.preventDefault();
      this.value = ((pos + this.range) / this.range) * 0.5;
      this.updatePinCirclePosition();
      this.pushOutput(PlugPosition.WEST, new ControlSignal(this.value));
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
  }
}
