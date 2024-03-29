import Konva from 'konva';
import Mod from './Mod';
import PlugType from './PlugType';
import PlugPosition from './PlugPosition';
import ControlSignal from './ControlSignal';

export default class Knob extends Mod {
  range: number = 400;

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
    let posX = 0;
    group.on('wheel', (e) => {
      const event = e.evt;
      // https://medium.com/@auchenberg/detecting-multi-touch-trackpad-gestures-in-javascript-a2505babb10e
      if (!event.ctrlKey) {
        // Your trackpad X and Y positions
        posX -= event.deltaX * 2;
        if (posX < -this.range) {
          posX = -this.range;
        } else if (posX > this.range) {
          posX = this.range;
        }
      }
      event.preventDefault();
      this.value = ((posX + this.range) / this.range) * 0.5;
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

    this.drawKnob(group);
    this.addWheelListener(group);
  }
}
