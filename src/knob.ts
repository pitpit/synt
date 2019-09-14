import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';
import Konva from 'konva';

export default class Knob extends Mod {
  range: number = 400;
  value: number = 0.5;
  callback: any;

  constructor() {
    super();
    this.configure('knob', 1, 1, [PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.CTRL]);
  }

  /**
   * @private
   */
  _addWheelListener(group:Konva.Group) {
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
      this.value = (posX + this.range) / this.range * 0.5;
      console.debug(this.value);
      if (this.callback) {
        this.callback(this.value);
      }
    });
  }

  _drawKnob(group:Konva.Group) {

    const circle = new Konva.Circle({
      x: group.width() / 2,
      y: group.height() / 2,
      radius: 24,
      // fill: 'white',
      stroke: 'black',
      strokeWidth: 4,
    });

    const innerCircle = new Konva.Circle({
      x: group.width() / 2,
      y: group.height() / 2,
      radius: 19,
      fill: 'black'
    });
    const pinCircle = new Konva.Circle({
      x: group.width() / 2,
      y: group.height() / 2 - 12,
      radius: 2,
      fill: 'white',
    });

    group.add(circle);
    group.add(innerCircle);
    group.add(pinCircle);
  }

  draw(group:Konva.Group) {
    this._drawKnob(group);
    this._addWheelListener(group);
  }

  wire(audioContext:AudioContext): void {
    const input = this.getInput(PlugPosition.WEST);
    if (input instanceof Function) {
      this.callback = input;
      this.callback(this.value);
    }
  }

  unwire(audioContext:AudioContext): void {
    this.callback = null;
  }
}
