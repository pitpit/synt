import Konva from 'konva';
import PlugType from './PlugType';
import PlugPosition from './PlugPosition';
import Mod from './Mod';

export default class Plug {
  type: symbol = PlugType.NULL;

  mod: Mod | null = null;

  /** Which face this plug is on (0=N,1=E,2=S,3=W). -1 means unset (falls back to plugPosition). */
  side: number = -1;

  /** Which slot row (for E/W faces) or slot col (for N/S faces) this plug is drawn at. */
  slotOffset: number = 0;

  /** Index in the remote mod's plugs array; set during link(), -1 when unlinked. */
  remoteIndex: number = -1;

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
      ) || (
        PlugType.CLKIN === this.type
        && PlugType.CLKOUT === toPlug.type
      ) || (
        PlugType.CLKOUT === this.type
        && PlugType.CLKIN === toPlug.type
      )
    ) {
      return true;
    }

    return false;
  }

  isOutput() {
    return (this.type === PlugType.OUT || this.type === PlugType.CTRLOUT || this.type === PlugType.CLKOUT);
  }

  isInput() {
    return (this.type === PlugType.IN || this.type === PlugType.CTRLIN || this.type === PlugType.CLKIN);
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
    const effSide = this.side !== -1 ? this.side : plugPosition;

    if (
      PlugType.IN === this.type
      || PlugType.OUT === this.type
    ) {
      this.drawIoPlug(
        group,
        effSide,
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
      || PlugType.CLKIN === this.type
      || PlugType.CLKOUT === this.type
    ) {
      this.drawCtrlPlug(
        group,
        effSide,
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

    if (PlugPosition.NORTH === plugPosition) {
      const y = strokeWidth + plugLineStrokeWidth / 2;
      const xStart = this.slotOffset * slotWidth + strokeWidth;
      const xMid = this.slotOffset * slotWidth + slotWidth / 2;
      const xEnd = (this.slotOffset + 1) * slotWidth - strokeWidth;
      group.add(new Konva.Line({
        points: [xStart, y, xMid, y],
        stroke: 'green',
        strokeWidth: plugLineStrokeWidth,
        lineCap: 'butt',
      }));
      group.add(new Konva.Line({
        points: [xMid, y, xEnd, y],
        stroke: 'red',
        strokeWidth: plugLineStrokeWidth,
        lineCap: 'butt',
      }));
    } else if (PlugPosition.EAST === plugPosition) {
      const x = width * slotWidth - (strokeWidth + plugLineStrokeWidth / 2);
      const yStart = this.slotOffset * slotHeight + strokeWidth;
      const yEnd = (this.slotOffset + 1) * slotHeight - strokeWidth;
      group.add(new Konva.Line({
        points: [x, yStart, x, yEnd],
        stroke: color,
        strokeWidth: plugLineStrokeWidth,
        lineCap: 'butt',
      }));
    } else if (PlugPosition.SOUTH === plugPosition) {
      const y = height * slotHeight - (strokeWidth + plugLineStrokeWidth / 2);
      const xStart = this.slotOffset * slotWidth + strokeWidth;
      const xMid = this.slotOffset * slotWidth + slotWidth / 2;
      const xEnd = (this.slotOffset + 1) * slotWidth - strokeWidth;
      group.add(new Konva.Line({
        points: [xStart, y, xMid, y],
        stroke: 'red',
        strokeWidth: plugLineStrokeWidth,
        lineCap: 'butt',
      }));
      group.add(new Konva.Line({
        points: [xMid, y, xEnd, y],
        stroke: 'green',
        strokeWidth: plugLineStrokeWidth,
        lineCap: 'butt',
      }));
    } else if (PlugPosition.WEST === plugPosition) {
      const x = strokeWidth + plugLineStrokeWidth / 2;
      const yStart = this.slotOffset * slotHeight + strokeWidth;
      const yEnd = (this.slotOffset + 1) * slotHeight - strokeWidth;
      group.add(new Konva.Line({
        points: [x, yStart, x, yEnd],
        stroke: color,
        strokeWidth: plugLineStrokeWidth,
        lineCap: 'butt',
      }));
    } else {
      throw new Error('Invalid plugPosition value');
    }
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
    } else if (PlugType.CLKIN === this.type) {
      color1 = 'deeppink';
      color2 = 'cyan';
    } else if (PlugType.CLKOUT === this.type) {
      color1 = 'cyan';
      color2 = 'deeppink';
    } else {
      throw new Error('Invalid plug type');
    }

    let bottomPoints: Array<number>;
    let topPoints: Array<number>;
    if (PlugPosition.NORTH === plugPosition) {
      const y = strokeWidth + plugLineStrokeWidth / 2;
      const xStart = this.slotOffset * slotWidth + strokeWidth;
      const xMid = this.slotOffset * slotWidth + slotWidth / 2;
      const xEnd = (this.slotOffset + 1) * slotWidth - strokeWidth;
      bottomPoints = [xStart, y, xMid, y];
      topPoints = [xMid, y, xEnd, y];
    } else if (PlugPosition.EAST === plugPosition) {
      const x = width * slotWidth - (strokeWidth + plugLineStrokeWidth / 2);
      const yStart = this.slotOffset * slotHeight + strokeWidth;
      const yMid = this.slotOffset * slotHeight + slotHeight / 2;
      const yEnd = (this.slotOffset + 1) * slotHeight - strokeWidth;
      bottomPoints = [x, yStart, x, yMid];
      topPoints = [x, yMid, x, yEnd];
    } else if (PlugPosition.SOUTH === plugPosition) {
      const y = height * slotHeight - (strokeWidth + plugLineStrokeWidth / 2);
      const xStart = this.slotOffset * slotWidth + strokeWidth;
      const xMid = this.slotOffset * slotWidth + slotWidth / 2;
      const xEnd = (this.slotOffset + 1) * slotWidth - strokeWidth;
      bottomPoints = [xStart, y, xMid, y];
      topPoints = [xMid, y, xEnd, y];
    } else if (PlugPosition.WEST === plugPosition) {
      const x = strokeWidth + plugLineStrokeWidth / 2;
      const yStart = this.slotOffset * slotHeight + strokeWidth;
      const yMid = this.slotOffset * slotHeight + slotHeight / 2;
      const yEnd = (this.slotOffset + 1) * slotHeight - strokeWidth;
      bottomPoints = [x, yStart, x, yMid];
      topPoints = [x, yMid, x, yEnd];
    } else {
      throw new Error('Invalid plugPosition value');
    }
    group.add(new Konva.Line({
      points: bottomPoints,
      stroke: color1,
      strokeWidth: plugLineStrokeWidth,
      lineCap: 'butt',
    }));
    group.add(new Konva.Line({
      points: topPoints,
      stroke: color2,
      strokeWidth: plugLineStrokeWidth,
      lineCap: 'butt',
    }));
  }
}
