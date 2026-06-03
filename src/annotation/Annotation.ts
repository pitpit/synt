import Konva from 'konva';

export default abstract class Annotation {
  pixelX: number = 0;

  pixelY: number = 0;

  group: Konva.Group | null = null;

  abstract init(slotWidth: number, slotHeight: number, group: Konva.Group): void;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onDelete(): void {}

  snatch(): void {
    this.group?.destroy();
    this.group = null;
  }
}
