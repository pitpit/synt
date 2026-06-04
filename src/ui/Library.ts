import Konva from 'konva';
import Rack from '../core/Rack';
import Mod from '../core/Mod';
import SineOscillator from '../oscillator/SineOscillator';
import SquareOscillator from '../oscillator/SquareOscillator';
import SawtoothOscillator from '../oscillator/SawtoothOscillator';
import TriangleOscillator from '../oscillator/TriangleOscillator';
import Gate from '../control/Gate';
import Chorus from '../effect/Chorus';
import Flanger from '../effect/Flanger';
import Vibrato from '../effect/Vibrato';
import Tremolo from '../effect/Tremolo';
import Panner from '../effect/Panner';
import Phaser from '../effect/Phaser';
import Reverb from '../effect/Reverb';
import HighPassFilter from '../filter/HighPassFilter';
import Arpeggiator from '../control/Arpeggiator';
import Knob from '../control/Knob';
import SwitchOn from '../control/SwitchOn';
import ControlMeter from '../control/ControlMeter';
import MidiIn from '../control/MidiIn';
import Oscilloscope from '../control/Oscilloscope';
import Speaker from '../output/Speaker';

type ModConstructor = new () => Mod;
type Category = 'oscillator' | 'effect' | 'filter' | 'control' | 'output' | 'misc';

interface ProtoEntry {
  Ctor: ModConstructor;
  label: string;
  category: Category;
}

const PROTOS: ProtoEntry[] = [
  { Ctor: SineOscillator,     label: 'sine',    category: 'oscillator' },
  { Ctor: SquareOscillator,   label: 'square',  category: 'oscillator' },
  { Ctor: SawtoothOscillator, label: 'saw',     category: 'oscillator' },
  { Ctor: TriangleOscillator, label: 'triangle',category: 'oscillator' },
  { Ctor: Vibrato,            label: 'vibrato', category: 'effect' },
  { Ctor: Tremolo,            label: 'tremolo', category: 'effect' },
  { Ctor: Panner,             label: 'pan',     category: 'effect' },
  { Ctor: Flanger,            label: 'flanger', category: 'effect' },
  { Ctor: Chorus,             label: 'chorus',  category: 'effect' },
  { Ctor: Phaser,             label: 'phaser',  category: 'effect' },
  { Ctor: Reverb,             label: 'reverb',  category: 'effect' },
  { Ctor: HighPassFilter,     label: 'hp-flt',  category: 'filter' },
  { Ctor: Gate,               label: 'gate',    category: 'control' },
  { Ctor: Arpeggiator,        label: 'arp',     category: 'control' },
  { Ctor: Knob,               label: 'knob',    category: 'control' },
  { Ctor: SwitchOn,           label: 'switch',  category: 'control' },
  { Ctor: ControlMeter,       label: 'ctrl-m',  category: 'control' },
  { Ctor: Oscilloscope,       label: 'scope',   category: 'control' },
  { Ctor: Speaker,            label: 'speaker', category: 'output' },
  { Ctor: MidiIn,             label: 'midi',    category: 'misc' },
];

const CATEGORY_ORDER: Category[] = ['oscillator', 'effect', 'filter', 'control', 'output', 'misc'];

/** Height in px of each category header label (in panel-local coords = screen pixels). */
const HEADER_H = 30;
/** Padding around the panel content (screen pixels). */
const PANEL_PAD = 8;
/** Width of the scrollbar thumb in screen pixels. */
const SCROLLBAR_W = 6;
/** Right margin for the scrollbar. */
const SCROLLBAR_MARGIN = 4;
/** Number of module columns visible in desktop library panel. */
const DESKTOP_COLS = 3;
/** Panel slide animation duration in ms. */
const PANEL_ANIMATION_MS = 220;

export default class Library {
  private rack: Rack;

  private toggleButton: HTMLButtonElement | null = null;

  /** Layer containing all library Konva content. Recreated on each draw(). */
  private mainLayer: Konva.Layer | null = null;

  /** Outer group: positioned to counteract stage pan/zoom. */
  private panelGroup: Konva.Group | null = null;

  /** Inner scroll group: shifted up/down to scroll panel content. */
  private scrollGroup: Konva.Group | null = null;

  private panelBg: Konva.Rect | null = null;

  private contentClipGroup: Konva.Group | null = null;

  private scrollbarTrack: Konva.Rect | null = null;

  private scrollbarThumb: Konva.Rect | null = null;

  private isOpen = false;

  private animatedScreenX = window.innerWidth;

  private animationFrameId: number | null = null;

  private scrollY = 0;

  private totalContentHeight = 0;

  constructor(rack: Rack) {
    this.rack = rack;

    this.toggleButton = document.createElement('button');
    this.toggleButton.id = 'library-open-btn';
    this.toggleButton.textContent = '+';
    document.body.appendChild(this.toggleButton);
    this.syncToggleButtonState();

    this.toggleButton.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('synt:library-toggle'));
    });
    window.addEventListener('synt:library-toggle', () => { this.toggle(); });
  }

  private get panelWidth(): number {
    if (window.innerWidth <= 768) return window.innerWidth;
    return (PANEL_PAD * 2) + (this.rack.slotWidth * DESKTOP_COLS) + SCROLLBAR_W + (SCROLLBAR_MARGIN * 2);
  }

  /** Called from Rack.draw() with the main layer. Rebuilds the panel. */
  draw(stage: Konva.Stage): void {
    const layer = new Konva.Layer();
    stage.add(layer);
    this.mainLayer = layer;
    this.scrollY = 0;
    this.buildPanel(layer);
    this.animatedScreenX = this.getTargetScreenX();
    this.panelGroup?.visible(this.isOpen);
    this.syncTransform();

    // Re-register transform listeners under a namespace so they can be cleared
    this.rack.stage.off('.libpanel');
    this.rack.stage.on(
      'xChange.libpanel yChange.libpanel scaleXChange.libpanel scaleYChange.libpanel',
      () => { this.syncTransform(); },
    );

    window.removeEventListener('resize', this.onResize);
    window.addEventListener('resize', this.onResize);
  }

  private readonly onResize = (): void => {
    if (!this.panelGroup || !this.panelBg) return;
    const pw = this.panelWidth;
    const vh = window.innerHeight;
    this.panelBg.width(pw);
    this.panelBg.height(vh);
    this.contentClipGroup?.clip({ x: 0, y: 0, width: pw - SCROLLBAR_W - SCROLLBAR_MARGIN * 2, height: vh });
    this.scrollbarTrack?.height(vh);
    this.scrollbarTrack?.x(pw - SCROLLBAR_W - SCROLLBAR_MARGIN);
    this.scrollbarThumb?.x(pw - SCROLLBAR_W - SCROLLBAR_MARGIN);
    this.updateScrollbarThumb();
    this.syncTransform();
  };

  open(): void {
    this.isOpen = true;
    this.applyPanelTransform(this.animatedScreenX);
    this.panelGroup?.visible(true);
    this.syncToggleButtonState();
    this.animatePanelToState();
  }

  close(): void {
    this.isOpen = false;
    this.rack.stage.draggable(true);
    this.rack.enableStageGestures();
    this.syncToggleButtonState();
    this.animatePanelToState();
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private syncToggleButtonState(): void {
    if (!this.toggleButton) return;
    this.toggleButton.textContent = this.isOpen ? 'x' : '+';
    this.toggleButton.classList.toggle('is-open', this.isOpen);
    this.toggleButton.setAttribute('aria-pressed', this.isOpen ? 'true' : 'false');
    this.toggleButton.setAttribute('aria-label', this.isOpen ? 'Close mod library' : 'Open mod library');
  }

  private updateScrollbarThumb(): void {
    const { scrollbarThumb } = this;
    if (!scrollbarThumb) return;
    const viewH = window.innerHeight;
    const thumbH = Math.max(40, (viewH / this.totalContentHeight) * viewH);
    const maxScroll = Math.max(0, this.totalContentHeight - viewH);
    scrollbarThumb.height(thumbH);
    scrollbarThumb.y(maxScroll > 0 ? (this.scrollY / maxScroll) * (viewH - thumbH) : 0);
    scrollbarThumb.visible(this.totalContentHeight > viewH);
    this.scrollbarTrack?.visible(this.totalContentHeight > viewH);
  }

  /**
   * Counteract stage pan/zoom so the panel stays fixed in screen space.
   * Animates the panel sliding in/out based on isOpen.
   */
  private syncTransform(): void {
    if (this.animationFrameId === null && !this.isOpen) {
      this.panelGroup?.visible(false);
      this.mainLayer?.batchDraw();
      return;
    }

    this.panelGroup?.visible(true);

    if (this.animationFrameId !== null) {
      this.applyPanelTransform(this.animatedScreenX);
      return;
    }

    this.animatedScreenX = this.getTargetScreenX();
    this.applyPanelTransform(this.animatedScreenX);
  }

  private getTargetScreenX(): number {
    return this.isOpen ? window.innerWidth - this.panelWidth : window.innerWidth;
  }

  private applyPanelTransform(screenX: number): void {
    const { panelGroup, mainLayer } = this;
    if (!panelGroup || !mainLayer) return;

    const scale = this.rack.stage.scaleX();
    const sx = this.rack.stage.x();
    const sy = this.rack.stage.y();

    // Convert to layer coordinates (counteract stage transform)
    const layerX = (screenX - sx) / scale;
    const layerY = (0 - sy) / scale;

    panelGroup.position({ x: layerX, y: layerY });
    // Scale content to 1:1 screen pixels regardless of rack zoom level
    panelGroup.scale({ x: 1 / scale, y: 1 / scale });
    mainLayer.batchDraw();
  }

  private animatePanelToState(): void {
    const targetScreenX = this.getTargetScreenX();
    const startScreenX = this.animatedScreenX;
    if (Math.abs(targetScreenX - startScreenX) < 0.5) {
      this.animatedScreenX = targetScreenX;
      this.syncTransform();
      return;
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    const startTime = performance.now();
    const step = (timestamp: number): void => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / PANEL_ANIMATION_MS);
      const eased = 1 - ((1 - progress) ** 3);
      this.animatedScreenX = startScreenX + ((targetScreenX - startScreenX) * eased);
      this.applyPanelTransform(this.animatedScreenX);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(step);
        return;
      }

      this.animatedScreenX = targetScreenX;
      this.animationFrameId = null;
      this.panelGroup?.visible(this.isOpen);
      this.applyPanelTransform(this.animatedScreenX);
    };

    this.animationFrameId = requestAnimationFrame(step);
  }

  private buildPanel(layer: Konva.Layer): void {
    const { rack } = this;
    const { slotWidth, slotHeight } = rack;
    const pw = this.panelWidth;
    const vh = window.innerHeight;
    const contentW = pw - SCROLLBAR_W - SCROLLBAR_MARGIN * 2;
    const cols = Math.max(1, Math.floor((contentW - 2 * PANEL_PAD) / slotWidth));

    // Outer group: no clip — holds both clipped content and unclipped scrollbar.
    this.panelGroup = new Konva.Group();
    layer.add(this.panelGroup);

    // Block stage gestures only while the pointer is over the panel.
    this.panelGroup.on('mouseenter', () => {
      if (!this.isOpen) return;
      rack.stage.draggable(false);
      rack.disableStageGestures();
    });
    this.panelGroup.on('mouseleave', () => {
      rack.stage.draggable(true);
      rack.enableStageGestures();
    });

    // Background covers the full panel width.
    this.panelBg = new Konva.Rect({
      x: 0,
      y: 0,
      width: pw,
      height: vh,
      fill: '#f2f2f2',
      stroke: '#111111',
      strokeWidth: 2,
      shadowColor: 'rgba(0,0,0,0.18)',
      shadowBlur: 18,
      shadowOffsetX: -4,
      shadowOffsetY: 0,
    });
    this.panelGroup.add(this.panelBg);

    // Clipped group: content scrolls inside here, scrollbar stays outside.
    this.contentClipGroup = new Konva.Group({
      clip: { x: 0, y: 0, width: contentW, height: vh },
    });
    this.panelGroup.add(this.contentClipGroup);

    this.scrollGroup = new Konva.Group({ x: 0, y: 0 });
    this.contentClipGroup.add(this.scrollGroup);
    const scrollGroup = this.scrollGroup;

    // Build category headers and mod tiles.
    let cursor = PANEL_PAD;
    CATEGORY_ORDER.forEach((cat) => {
      const entries = PROTOS.filter((p) => p.category === cat);
      if (entries.length === 0) return;

      scrollGroup.add(new Konva.Text({
        x: PANEL_PAD,
        y: cursor,
        width: contentW - 2 * PANEL_PAD,
        height: HEADER_H,
        text: cat.toUpperCase(),
        fontSize: 11,
        fontFamily: '"Rubik", Helvetica, sans-serif',
        fontStyle: 'bold',
        fill: '#888888',
        verticalAlign: 'middle',
      }));
      cursor += HEADER_H;

      const rowStart = cursor;
      entries.forEach((proto, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const group = new Konva.Group({
          x: PANEL_PAD + col * slotWidth,
          y: rowStart + row * slotHeight,
        });
        scrollGroup.add(group);

        const tempMod = new proto.Ctor();
        tempMod.drawVisual(group, slotWidth, slotHeight);
        this.attachGhostDrag(layer, group, proto);
      });

      cursor += Math.ceil(entries.length / cols) * slotHeight + PANEL_PAD;
    });
    this.totalContentHeight = cursor;

    // Scrollbar track.
    const scrollbarX = pw - SCROLLBAR_W - SCROLLBAR_MARGIN;
    this.scrollbarTrack = new Konva.Rect({
      x: scrollbarX,
      y: 0,
      width: SCROLLBAR_W,
      height: vh,
      fill: '#eeeeee',
      cornerRadius: SCROLLBAR_W / 2,
      visible: this.totalContentHeight > vh,
    });
    this.panelGroup.add(this.scrollbarTrack);

    // Scrollbar thumb — initial height/y set by updateScrollbarThumb().
    this.scrollbarThumb = new Konva.Rect({
      x: scrollbarX,
      y: 0,
      width: SCROLLBAR_W,
      height: 40,
      fill: '#999999',
      cornerRadius: SCROLLBAR_W / 2,
      visible: this.totalContentHeight > vh,
    });
    this.panelGroup.add(this.scrollbarThumb);
    this.updateScrollbarThumb();

    // Thumb drag via manual pointer tracking (avoids Konva dragBoundFunc coord issues).
    let thumbDragActive = false;
    let thumbDragStartScreenY = 0;
    let scrollAtThumbDragStart = 0;

    this.scrollbarThumb.on('mousedown touchstart', (e) => {
      e.cancelBubble = true;
      (e.evt as Event).preventDefault();
      rack.stage.draggable(false);
      thumbDragActive = true;
      thumbDragStartScreenY = rack.stage.getPointerPosition()?.y ?? 0;
      scrollAtThumbDragStart = this.scrollY;
    });

    rack.stage.on('mousemove.libthumb touchmove.libthumb', () => {
      if (!thumbDragActive) return;
      const screenY = rack.stage.getPointerPosition()?.y ?? thumbDragStartScreenY;
      const deltaScreen = screenY - thumbDragStartScreenY;
      const thumbH = this.scrollbarThumb?.height() ?? 40;
      const maxScroll = Math.max(0, this.totalContentHeight - vh);
      const ratio = deltaScreen / (vh - thumbH);
      this.scrollY = Math.max(0, Math.min(maxScroll, scrollAtThumbDragStart + ratio * maxScroll));
      scrollGroup.y(-this.scrollY);
      this.updateScrollbarThumb();
      layer.batchDraw();
    });

    rack.stage.on('mouseup.libthumb touchend.libthumb', () => {
      if (!thumbDragActive) return;
      thumbDragActive = false;
      if (!this.isOpen) {
        rack.stage.draggable(true);
        rack.enableStageGestures();
      }
    });

    // Scroll via wheel.
    this.panelGroup.on('wheel', (e) => {
      e.cancelBubble = true;
      const maxScroll = Math.max(0, this.totalContentHeight - window.innerHeight);
      this.scrollY = Math.max(0, Math.min(maxScroll, this.scrollY + e.evt.deltaY));
      scrollGroup.y(-this.scrollY);
      this.updateScrollbarThumb();
      layer.batchDraw();
    });

    // Scroll via single-touch swipe.
    let lastTouchY = 0;
    this.panelGroup.on('touchstart', (e) => {
      if (e.evt.touches.length > 0) lastTouchY = e.evt.touches[0].clientY;
    });
    this.panelGroup.on('touchmove', (e) => {
      e.cancelBubble = true;
      if (e.evt.touches.length !== 1) return;
      const deltaY = lastTouchY - e.evt.touches[0].clientY;
      lastTouchY = e.evt.touches[0].clientY;
      const maxScroll = Math.max(0, this.totalContentHeight - window.innerHeight);
      this.scrollY = Math.max(0, Math.min(maxScroll, this.scrollY + deltaY));
      scrollGroup.y(-this.scrollY);
      this.updateScrollbarThumb();
      layer.batchDraw();
    });

    // Block stage pan for any click anywhere inside the panel (belt-and-suspenders
    // alongside stage.draggable(false) set in open()).
    this.panelGroup.on('mousedown touchstart', (e) => {
      if (!this.isOpen) return;
      e.cancelBubble = true;
    });
  }

  private attachGhostDrag(
    layer: Konva.Layer,
    protoGroup: Konva.Group,
    proto: ProtoEntry,
  ): void {
    const { rack } = this;
    const { slotWidth, slotHeight, padding } = rack;

    // Grab offset: center the ghost under the cursor
    const grabOffsetX = slotWidth / 2;
    const grabOffsetY = slotHeight / 2;

    let ghost: Konva.Group | null = null;

    protoGroup.on('mouseenter', () => {
      document.body.style.cursor = 'grab';
    });
    protoGroup.on('mouseleave', () => {
      if (ghost) return;
      document.body.style.cursor = '';
    });

    protoGroup.on('mousedown touchstart', (e) => {
      if (!this.isOpen) return;
      e.cancelBubble = true;
      (e.evt as Event).preventDefault();
      rack.stage.draggable(false);
      document.body.style.cursor = 'grab';

      // Close the panel after a short delay so the user sees the drag start
      setTimeout(() => { this.close(); }, 150);

      // Get pointer in layer (world) coords
      const screenPos = rack.stage.getPointerPosition();
      if (!screenPos) return;
      const scale = rack.stage.scaleX();
      const layerX = (screenPos.x - rack.stage.x()) / scale;
      const layerY = (screenPos.y - rack.stage.y()) / scale;

      // Snap highlight shown on the main rack
      let snapHighlight: Konva.Rect | null = new Konva.Rect({
        x: 0,
        y: 0,
        width: slotWidth,
        height: slotHeight,
        fill: '#cccccc',
        opacity: 0.6,
        stroke: '#dddddd',
        strokeWidth: 1,
        visible: false,
      });
      layer.add(snapHighlight);

      // Ghost group in main layer (world coords)
      ghost = new Konva.Group({ x: layerX - grabOffsetX, y: layerY - grabOffsetY });
      layer.add(ghost);
      const ghostMod = new proto.Ctor();
      ghostMod.drawVisual(ghost, slotWidth, slotHeight);
      layer.batchDraw();

      rack.stage.on('mousemove.libghost touchmove.libghost', (moveEvt) => {
        const moveTouch = moveEvt.evt as { touches?: TouchList };
        if (moveTouch.touches && moveTouch.touches.length >= 2) return;
        (moveEvt.evt as Event).preventDefault();
        if (!ghost) return;

        const p = layer.getRelativePointerPosition();
        if (!p) return;
        ghost.position({ x: p.x - grabOffsetX, y: p.y - grabOffsetY });

        // Show snap highlight when ghost is over the rack area
        const gy = ghost.y();
        const gx = ghost.x();
        if (gy >= 0 && snapHighlight) {
          const gridX = Math.round((gx - padding) / slotWidth);
          const gridY = Math.round((gy - padding) / slotHeight);
          if (
            gridX >= 0 && gridY >= 0
            && gridX < rack.stageWidth && gridY < rack.stageHeight
            && this.isSlotFree(gridX, gridY)
          ) {
            snapHighlight.position({
              x: padding + gridX * slotWidth,
              y: padding + gridY * slotHeight,
            });
            snapHighlight.show();
          } else {
            snapHighlight.hide();
          }
        } else if (snapHighlight) {
          snapHighlight.hide();
        }

        layer.batchDraw();
      });

      rack.stage.on('mouseup.libghost touchend.libghost', (upEvt) => {
        const upTouch = upEvt.evt as { touches?: TouchList };
        if (upTouch.touches && upTouch.touches.length > 0) return;

        rack.stage.off('.libghost');
        if (!this.isOpen) {
          rack.stage.draggable(true);
          rack.enableStageGestures();
        }
        document.body.style.cursor = '';

        if (snapHighlight) {
          snapHighlight.destroy();
          snapHighlight = null;
        }

        if (!ghost) return;
        const gx = ghost.x();
        const gy = ghost.y();
        ghost.destroy();
        ghost = null;
        layer.batchDraw();

        const gridX = Math.round((gx - padding) / slotWidth);
        const gridY = Math.round((gy - padding) / slotHeight);

        if (
          gridX >= 0
          && gridY >= 0
          && gridX < rack.stageWidth
          && gridY < rack.stageHeight
          && this.isSlotFree(gridX, gridY)
        ) {
          rack.addMod(new proto.Ctor(), gridX, gridY);
        }
      });
    });
  }

  /**
   * Check whether a 1×1 slot is free in the main rack without
   * instantiating a Mod (avoids audio side-effects for abandoned drops).
   */
  private isSlotFree(x: number, y: number): boolean {
    return !this.rack.mods.some(
      (mod) => (
        x < mod.x + mod.width && x + 1 > mod.x
        && y < mod.y + mod.height && y + 1 > mod.y
      ),
    );
  }
}
