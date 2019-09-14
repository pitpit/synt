import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';
import Konva from 'konva';

export default class Knob extends Mod {
  range: number = 400;
  value: number = 1.0;
  callback: any;

  constructor() {
    super();
    this.configure('knob', 1, 1, [PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.CTRL]);
  }

  draw(group:Konva.Group) {
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

  wire(audioContext:AudioContext): void {
    const input = this.getInput(PlugPosition.WEST);
    if (input instanceof Function) {
      this.callback = input;
    }
  }

  unwire(audioContext:AudioContext): void {
    this.callback = null;
  }
}
