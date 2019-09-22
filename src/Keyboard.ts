import Mod from './Mod';
import PlugType from './PlugType';
import PlugPosition from './PlugPosition';
import Konva from 'konva';
import { Signals, BrokenAudioSignal, ControlSignal } from './Signal';
import keyboardSvg from './images/keyboard.svg';

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
    this.configure([PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.CTRLOUT]);
  }

  draw(group: Konva.Group) {
    Konva.Image.fromURL(keyboardSvg, (image: Konva.Image) => {
      const width = 80;
      const height = width * image.height() / image.width();
      image.width(width);
      image.height(height);
      image.x(10);
      image.y(10);
      group.add(image);
      image.draw();
    });
  }
}
