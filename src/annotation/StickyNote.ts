import Konva from 'konva';
import Annotation from './Annotation';

const NOTE_SLOTS_WIDE = 3;
const NOTE_PADDING = 10;

export default class StickyNote extends Annotation {
  private content: string;

  private textNode: Konva.Text | null = null;

  private bgShape: Konva.Shape | null = null;

  private deleteBtn: Konva.Group | null = null;

  private closeEditor: (() => void) | null = null;

  private slotWidth: number = 100;

  private slotHeight: number = 100;

  constructor(text: string = '') {
    super();
    this.content = text;
  }

  get text(): string {
    return this.content;
  }

  init(slotWidth: number, slotHeight: number, group: Konva.Group): void {
    this.group = group;
    this.slotWidth = slotWidth;
    this.slotHeight = slotHeight;
    group.position({ x: this.pixelX, y: this.pixelY });
    this.drawContent();

    group.on('mouseenter', (e) => {
      let node: Konva.Node | null = e.target;
      while (node && node !== group) {
        if (node === this.deleteBtn) return;
        node = node.getParent();
      }
      document.body.style.cursor = 'grab';
      group.getLayer()?.batchDraw();
    });
    group.on('mouseleave', () => {
      if (!group.isDragging()) {
        document.body.style.cursor = '';
        group.getLayer()?.batchDraw();
      }
    });
    group.on('dragstart', () => {
      document.body.style.cursor = 'grab';
      group.moveToTop();
    });
    group.on('dragend', () => {
      document.body.style.cursor = '';
      this.pixelX = group.x();
      this.pixelY = group.y();
    });
    group.on('dblclick dbltap', () => {
      this.openInlineEditor();
    });
  }

  private openInlineEditor(): void {
    const group = this.group;
    const textNode = this.textNode;
    if (!group || !textNode) return;

    const stage = group.getStage();
    if (!stage) return;

    const noteWidth = NOTE_SLOTS_WIDE * this.slotWidth;

    textNode.visible(false);
    group.getLayer()?.batchDraw();

    const textarea = document.createElement('textarea');
    textarea.value = this.content;
    Object.assign(textarea.style, {
      position: 'fixed',
      padding: '0',
      margin: '0',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      resize: 'none',
      overflow: 'hidden',
      fontFamily: '"Courier New", Courier, "Lucida Sans Typewriter", monospace',
      lineHeight: '1.4',
      color: '#222222',
      zIndex: '2000',
      boxSizing: 'border-box',
    });

    const syncPosition = (): void => {
      const containerRect = stage.container().getBoundingClientRect();
      const absTransform = group.getAbsoluteTransform();
      const scale = stage.scaleX();
      const noteHeight = group.height();
      const textOrigin = absTransform.point({ x: NOTE_PADDING, y: NOTE_PADDING });
      textarea.style.left = `${String(containerRect.left + textOrigin.x)}px`;
      textarea.style.top = `${String(containerRect.top + textOrigin.y)}px`;
      textarea.style.width = `${String((noteWidth - 2 * NOTE_PADDING) * scale)}px`;
      textarea.style.minHeight = `${String(Math.max(0, noteHeight * scale - 2 * NOTE_PADDING * scale))}px`;
      textarea.style.fontSize = `${String(13 * scale)}px`;
    };

    syncPosition();

    const onStageTransform = (): void => { syncPosition(); };
    stage.on('xChange.stickyedit yChange.stickyedit scaleXChange.stickyedit scaleYChange.stickyedit', onStageTransform);

    const cleanup = (save: boolean) => {
      if (!this.closeEditor) return;
      this.closeEditor = null;
      stage.off('.stickyedit');
      textarea.removeEventListener('blur', onBlur);
      document.removeEventListener('touchstart', onOutsideTouch, true);
      if (save) this.content = textarea.value;
      textarea.remove();
      textNode.visible(true);
      if (save) this.updateDisplay();
      else group.getLayer()?.batchDraw();
    };

    const onBlur = () => { cleanup(true); };

    const onOutsideTouch = (e: TouchEvent) => {
      if (!textarea.contains(e.target as Node)) cleanup(true);
    };

    this.closeEditor = () => { cleanup(false); };

    textarea.addEventListener('blur', onBlur);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cleanup(false);
    });
    // Use capture so we see the event before Konva swallows it.
    document.addEventListener('touchstart', onOutsideTouch, true);

    document.body.appendChild(textarea);
    textarea.focus();
  }

  private drawContent(): void {
    const group = this.group;
    if (!group) return;

    const noteWidth = NOTE_SLOTS_WIDE * this.slotWidth;
    const minHeight = 2 * this.slotHeight;

    this.textNode = new Konva.Text({
      x: NOTE_PADDING,
      y: NOTE_PADDING,
      width: noteWidth - 2 * NOTE_PADDING,
      text: this.content,
      fontSize: 13,
      fontFamily: '"Courier New", Courier, "Lucida Sans Typewriter", monospace',
      fill: '#222222',
      wrap: 'word',
      lineHeight: 1.4,
    });

    const noteH = Math.max(minHeight, this.textNode.height() + 2 * NOTE_PADDING);
    group.size({ width: noteWidth, height: noteH });

    this.bgShape = new Konva.Shape({
      fill: '#ffe066',
      shadowColor: 'black',
      shadowBlur: 12,
      shadowOffset: { x: 3, y: 3 },
      shadowOpacity: 0.3,
      sceneFunc: (context: Konva.Context, shape: Konva.Shape) => {
        const w = NOTE_SLOTS_WIDE * this.slotWidth;
        const h = shape.getAttr('noteH') as number;
        context.beginPath();
        context.rect(0, 0, w, h);
        context.arc(w, 0, 12, 0, Math.PI * 2);
        context.fillStrokeShape(shape);
      },
    });
    this.bgShape.setAttr('noteH', noteH);
    group.add(this.bgShape);
    group.add(this.textNode);

    this.deleteBtn = new Konva.Group({
      x: noteWidth,
      y: 0,
    });
    this.deleteBtn.add(new Konva.Text({
      text: '\u00D7',
      fontSize: 18,
      fontStyle: 'bold',
      fill: 'black',
      width: 24,
      height: 24,
      offsetX: 12,
      offsetY: 10,
      align: 'center',
      verticalAlign: 'middle',
    }));
    this.deleteBtn.on('mouseenter', () => { document.body.style.cursor = 'pointer'; });
    this.deleteBtn.on('mouseleave', () => { document.body.style.cursor = 'grab'; });
    this.deleteBtn.on('click tap', (e) => {
      e.cancelBubble = true;
      this.closeEditor?.();
      this.onDelete();
    });
    group.add(this.deleteBtn);
  }

  private updateDisplay(): void {
    if (!this.textNode || !this.bgShape || !this.group) return;

    const noteWidth = NOTE_SLOTS_WIDE * this.slotWidth;
    const minHeight = 2 * this.slotHeight;

    this.textNode.text(this.content);
    const noteH = Math.max(minHeight, this.textNode.height() + 2 * NOTE_PADDING);
    this.bgShape.setAttr('noteH', noteH);
    this.group.height(noteH);
    this.deleteBtn?.position({ x: noteWidth, y: 0 });

    this.group.getLayer()?.batchDraw();
  }
}
