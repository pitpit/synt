import Konva from 'konva';
import PlugType from './PlugType';
import PlugPosition from './PlugPosition';
import Mod from './Mod';

export default class Plug {
  type: PlugType = PlugType.NULL;

  mod: Mod| null = null;

  isLinkable(toPlug: Plug) {
    if (
      (
        PlugType.OUT === this.type
        && PlugType.IN === toPlug.type
      ) || (
        PlugType.IN === this.type
        && PlugType.OUT === toPlug.type
      ) || (
        PlugType.CTRLIN === this.type
        && PlugType.CTRLOUT === toPlug.type
      ) || (
        PlugType.CTRLOUT === this.type
        && PlugType.CTRLIN === toPlug.type
      )
    ) {
      return true;
    }

    return false;
  }

  isOutput() {
    return (this.type === PlugType.OUT || this.type === PlugType.CTRLOUT);
  }

  isInput() {
    return (this.type === PlugType.IN || this.type === PlugType.CTRLIN);
  }

  draw(
    group: Konva.Group,
    plugPosition: number,
    width: number,
    height: number,
    slotWidth: number,
    slotHeight: number,
    strokeWidth: number,
  ) {
    const plugLineStrokeWidth = 5;

    if (
      PlugType.IN === this.type
      || PlugType.OUT === this.type
    ) {
      this.drawIoPlug(
        group,
        plugPosition,
        width,
        height,
        slotWidth,
        slotHeight,
        strokeWidth,
        plugLineStrokeWidth,
      );
    } else if (
      PlugType.CTRLIN === this.type
      || PlugType.CTRLOUT === this.type
    ) {
      this.drawCtrlPlug(
        group,
        plugPosition,
        width,
        height,
        slotWidth,
        slotHeight,
        strokeWidth,
        plugLineStrokeWidth,
      );
    }
  }

  /**
   * Draw input/output type indicator
   */
  private drawIoPlug(
    group: Konva.Group,
    plugPosition: number,
    width: number,
    height: number,
    slotWidth: number,
    slotHeight: number,
    strokeWidth: number,
    plugLineStrokeWidth: number,
  ): void {
    let color: string;
    if (PlugType.IN === this.type) {
      color = 'green';
    } else if (PlugType.OUT === this.type) {
      color = 'red';
    } else {
      throw new Error('Invalid plug type');
    }
    let points: Array<number> = [0, 0, 0, 0];

    if (PlugPosition.NORTH === plugPosition) {
      const y = strokeWidth + plugLineStrokeWidth / 2;
      points = [strokeWidth, y, slotWidth - strokeWidth, y];
    } else if (PlugPosition.EAST === plugPosition) {
      const y = width * slotWidth - (strokeWidth + plugLineStrokeWidth / 2);
      points = [y, strokeWidth, y, height * slotHeight - strokeWidth];
    } else if (PlugPosition.SOUTH === plugPosition) { // South
      const y = width * slotWidth - (strokeWidth + plugLineStrokeWidth / 2);
      points = [strokeWidth, y, slotWidth - strokeWidth, y];
    } else if (PlugPosition.WEST === plugPosition) { // West
      const x = strokeWidth + plugLineStrokeWidth / 2;
      points = [x, strokeWidth, x, height * slotHeight - strokeWidth];
    } else {
      throw new Error('Invalid plugPosition value');
    }

    const plugLine = new Konva.Line({
      points,
      stroke: color,
      strokeWidth: plugLineStrokeWidth,
      lineCap: 'sqare',
    });

    group.add(plugLine);
  }


  private drawCtrlPlug(
    group: Konva.Group,
    plugPosition: number,
    width: number,
    height: number,
    slotWidth: number,
    slotHeight: number,
    strokeWidth: number,
    plugLineStrokeWidth: number,
  ): void {
    let color1: string;
    let color2: string;
    if (PlugType.CTRLIN === this.type) {
      color1 = 'blue';
      color2 = 'orange';
    } else if (PlugType.CTRLOUT === this.type) {
      color1 = 'orange';
      color2 = 'blue';
    } else {
      throw new Error('Invalid plug type');
    }

    let bottomPoints: Array<number> = [0, 0, 0, 0];
    let topPoints: Array<number> = [0, 0, 0, 0];
    if (PlugPosition.NORTH === plugPosition) {
      const y = strokeWidth + plugLineStrokeWidth / 2;
      bottomPoints = [strokeWidth, y, slotWidth / 2, y];
      topPoints = [slotWidth / 2, y, slotWidth - strokeWidth, y];
    } else if (PlugPosition.EAST === plugPosition) {
      const x = width * slotWidth - (strokeWidth + plugLineStrokeWidth / 2);
      bottomPoints = [x, strokeWidth, x, height * (slotHeight / 2)];
      topPoints = [x, height * (slotHeight / 2), x, height * slotHeight - strokeWidth];
    } else if (PlugPosition.SOUTH === plugPosition) { // South
      const y = width * slotWidth - (strokeWidth + plugLineStrokeWidth / 2);
      bottomPoints = [strokeWidth, y, slotWidth / 2, y];
      topPoints = [slotWidth / 2, y, slotWidth - strokeWidth, y];
    } else if (PlugPosition.WEST === plugPosition) { // West
      const x = strokeWidth + plugLineStrokeWidth / 2;
      bottomPoints = [x, strokeWidth, x, height * (slotHeight / 2)];
      topPoints = [x, height * (slotHeight / 2), x, height * slotHeight - strokeWidth];
    } else {
      throw new Error('Invalid plugPosition value');
    }
    const plugLine1 = new Konva.Line({
      points: bottomPoints,
      stroke: color1,
      strokeWidth: plugLineStrokeWidth,
      lineCap: 'sqare',
    });
    const plugLine2 = new Konva.Line({
      points: topPoints,
      stroke: color2,
      strokeWidth: plugLineStrokeWidth,
      lineCap: 'sqare',
    });
    group.add(plugLine1);
    group.add(plugLine2);
  }
}
