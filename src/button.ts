import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';
import Konva from 'konva';

export default class Button extends Mod {
  centerX: number = 0;
  centerY: number = 0;
  callback: any;

  constructor() {
    super();
    this.configure('button', 1, 1, [PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.CTRL]);
  }

  _drawButton(group:Konva.Group) {
    const circle = new Konva.Circle({
      x: this.centerX,
      y: this.centerY,
      radius: 24,
      stroke: 'black',
      strokeWidth: 4,
    });

    group.on('click', () => {
      if (this.callback) {
        this.callback();
      }
    });
    group.add(circle);
  }

  draw(group:Konva.Group) {
    this.centerX = group.width() / 2;
    this.centerY = group.height() / 2;

    this._drawButton(group);
  }

  // onLinked(audioContext:AudioContext): void {
  //   const input = this.getInput(PlugPosition.WEST);
  //   if (input instanceof Function) {
  //     this.callback = input;
  //   }
  // }

  // onUnlinked(audioContext:AudioContext): void {
  //   this.callback = null;
  // }
}
