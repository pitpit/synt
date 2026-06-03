import Konva from 'konva';
import Annotation from './Annotation';

const NOTE_SLOTS_WIDE = 3;
const NOTE_PADDING = 10;

export default class StickyNote extends Annotation {
  private content: string;

  private textNode: Konva.Text | null = null;

  private bgShape: Konva.Shape | null = null;

  private deleteBtn: Konva.Group | null = null;

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
      let node: Konva.Node | null = e.target as Konva.Node;
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

    const container = stage.container();
    const containerRect = container.getBoundingClientRect();
    const absTransform = group.getAbsoluteTransform();
    const scale = stage.scaleX();

    const noteWidth = NOTE_SLOTS_WIDE * this.slotWidth;
    const noteHeight = group.height();

    // Position of text area relative to the page
    const textOrigin = absTransform.point({ x: NOTE_PADDING, y: NOTE_PADDING });
    const left = containerRect.left + textOrigin.x;
    const top = containerRect.top + textOrigin.y;
    const width = (noteWidth - 2 * NOTE_PADDING) * scale;
    const height = Math.max(0, noteHeight * scale - 2 * NOTE_PADDING * scale);

    textNode.visible(false);
    group.getLayer()?.batchDraw();

    const textarea = document.createElement('textarea');
    textarea.value = this.content;
    Object.assign(textarea.style, {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      minHeight: `${height}px`,
      padding: '0',
      margin: '0',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      resize: 'none',
      overflow: 'hidden',
      fontSize: `${13 * scale}px`,
      fontFamily: '"Courier New", Courier, "Lucida Sans Typewriter", monospace',
      lineHeight: '1.4',
      color: '#222222',
      zIndex: '2000',
      boxSizing: 'border-box',
    });

    const commit = () => {
      this.content = textarea.value;
      textarea.remove();
      textNode.visible(true);
      this.updateDisplay();
    };

    textarea.addEventListener('blur', commit);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        textarea.removeEventListener('blur', commit);
        textarea.remove();
        textNode.visible(true);
        group.getLayer()?.batchDraw();
      }
    });

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
