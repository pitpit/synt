import Konva from 'konva';
import Mod from './Mod';
import Modal from './Modal';
import PlugType from './PlugType';

export default class StickyNote extends Mod {
  private content: string;

  private modal: Modal;

  private textNode: Konva.Text | null = null;

  private thumbRect: Konva.Rect | null = null;

  private scrollOffset: number = 0;

  private textViewportHeight: number = 0;

  private textViewportY: number = 0;

  constructor(text: string = '') {
    super();
    this.content = text;
    this.configure(
      [PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.NULL],
      '',
      3,
      2,
    );

    this.modal = new Modal();
    this.modal.events.on('save', () => {
      const textarea = document.getElementById('sticky-textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        this.content = textarea.value;
        this.updateDisplay();
      }
    });

    this.events.on('dblclick', () => {
      this.modal.setContent('<textarea id="sticky-textarea" style="width:100%;height:300px;resize:vertical;overflow-y:auto;box-sizing:border-box;font-size:14px;padding:8px;font-family:\'Courier New\',Courier,monospace;"></textarea>');
      this.modal.open();
      const textarea = document.getElementById('sticky-textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.value = this.content;
      }
    });
  }

  draw(group: Konva.Group): void {
    const slotWidth = this.rack?.slotWidth ?? 0;
    const slotHeight = this.rack?.slotHeight ?? 0;

    const PADDING = 10;
    const SCROLLBAR_W = 14;
    const textX = PADDING;
    const textY = PADDING;
    const textW = this.width * slotWidth - PADDING * 2 - SCROLLBAR_W - 4;
    const textH = this.height * slotHeight - PADDING * 2;
    const trackX = textX + textW + 4;

    this.textViewportHeight = textH;
    this.textViewportY = textY;

    const textClipGroup = new Konva.Group({
      x: textX,
      y: textY,
      clipX: 0,
      clipY: 0,
      clipWidth: textW,
      clipHeight: textH,
    });

    this.textNode = new Konva.Text({
      x: 0,
      y: 0,
      width: textW,
      text: this.content,
      fontSize: 13,
      fontFamily: '"Courier New", Courier, "Lucida Sans Typewriter", monospace',
      fill: '#222222',
      wrap: 'word',
      lineHeight: 1.4,
    });

    textClipGroup.add(this.textNode);
    group.add(textClipGroup);

    // Scrollbar track
    const trackRect = new Konva.Rect({
      x: trackX,
      y: textY,
      width: SCROLLBAR_W,
      height: textH,
      fill: '#e0e0e0',
      cornerRadius: 3,
    });
    group.add(trackRect);

    // Scrollbar thumb
    this.thumbRect = new Konva.Rect({
      x: trackX,
      y: textY,
      width: SCROLLBAR_W,
      height: 20,
      fill: '#aaaaaa',
      cornerRadius: 3,
    });
    group.add(this.thumbRect);

    this.updateScrollbar();

    group.on('wheel', (e) => {
      e.evt.preventDefault();
      e.cancelBubble = true;
      this.scroll(e.evt.deltaY * 0.5, textClipGroup);
    });

    let lastTouchY: number | null = null;
    let touchStartLocalY: number | null = null;
    let isDragging = false;
    let nativeListenersAttached = false;

    const handleTouchMove = (e: TouchEvent) => {
      if (lastTouchY === null) return;
      isDragging = true;
      e.preventDefault();
      const touch = e.touches[0];
      const delta = touch.clientY - lastTouchY;
      lastTouchY = touch.clientY;
      this.scroll(delta, textClipGroup);
    };

    const handleTouchEnd = () => {
      if (!isDragging && touchStartLocalY !== null && this.thumbRect) {
        const thumbTop = this.thumbRect.y();
        const thumbBottom = thumbTop + this.thumbRect.height();
        const scrollAmount = this.textViewportHeight * 0.5;
        if (touchStartLocalY < thumbTop) {
          this.scroll(-scrollAmount, textClipGroup);
        } else if (touchStartLocalY > thumbBottom) {
          this.scroll(scrollAmount, textClipGroup);
        }
      }
      lastTouchY = null;
      touchStartLocalY = null;
      isDragging = false;
    };

    const attachNativeListeners = (stage: Konva.Stage) => {
      if (nativeListenersAttached) return;
      stage.container().addEventListener('touchmove', handleTouchMove, { passive: false });
      stage.container().addEventListener('touchend', handleTouchEnd);
      nativeListenersAttached = true;
    };

    trackRect.on('touchstart', (e) => {
      e.cancelBubble = true;
      const stage = group.getStage();
      if (!stage) return;
      const stagePos = stage.getPointerPosition();
      if (stagePos) {
        const localPos = group.getAbsoluteTransform().copy().invert().point(stagePos);
        touchStartLocalY = localPos.y;
      }
      lastTouchY = e.evt.touches[0].clientY;
      attachNativeListeners(stage);
    });

    this.thumbRect.on('touchstart', (e) => {
      e.cancelBubble = true;
      const stage = group.getStage();
      if (!stage) return;
      lastTouchY = e.evt.touches[0].clientY;
      attachNativeListeners(stage);
    });
  }

  private updateScrollbar(): void {
    if (!this.textNode || !this.thumbRect) return;

    const totalH = this.textNode.height();
    const viewH = this.textViewportHeight;
    const maxScroll = Math.max(0, totalH - viewH);

    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));

    const thumbRatio = totalH > 0 ? Math.min(1, viewH / totalH) : 1;
    const thumbH = Math.max(20, thumbRatio * viewH);
    const thumbY = maxScroll > 0
      ? (this.scrollOffset / maxScroll) * (viewH - thumbH)
      : 0;

    this.thumbRect.height(thumbH);
    this.thumbRect.y(this.textViewportY + thumbY);
  }

  private scroll(delta: number, textClipGroup: Konva.Group): void {
    if (!this.textNode) return;

    const totalH = this.textNode.height();
    const maxScroll = Math.max(0, totalH - this.textViewportHeight);

    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset + delta, maxScroll));
    this.textNode.y(-this.scrollOffset);

    this.updateScrollbar();

    const layer = textClipGroup.getLayer();
    if (layer) layer.batchDraw();
  }

  private updateDisplay(): void {
    if (!this.textNode) return;

    this.textNode.text(this.content);
    this.scrollOffset = 0;
    this.textNode.y(0);
    this.updateScrollbar();

    const layer = this.textNode.getLayer();
    if (layer) layer.batchDraw();
  }
}
