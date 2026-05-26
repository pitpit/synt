import Konva from 'konva';
import Rack from './Rack';
import Mod from './Mod';
import SineOscillator from '../oscillator/SineOscillator';
import SquareOscillator from '../oscillator/SquareOscillator';
import SawtoothOscillator from '../oscillator/SawtoothOscillator';
import TriangleOscillator from '../oscillator/TriangleOscillator';
import Gate from '../control/Gate';
import Vibrato from '../effect/Vibrato';
import Tremolo from '../effect/Tremolo';
import Panner from '../effect/Panner';
import Arpeggiator from '../control/Arpeggiator';
import Knob from '../control/Knob';
import SwitchOn from '../control/SwitchOn';
import Speaker from '../output/Speaker';

type ModConstructor = new () => Mod;

interface ProtoEntry {
  Ctor: ModConstructor;
  label: string;
  x: number;
  y: number;
}

const PROTOS: ProtoEntry[] = [
  { Ctor: SineOscillator,     label: 'sine',    x: 0, y: 0 },
  { Ctor: SquareOscillator,   label: 'square',  x: 1, y: 0 },
  { Ctor: SawtoothOscillator, label: 'saw',     x: 2, y: 0 },
  { Ctor: TriangleOscillator, label: 'triangle',x: 3, y: 0 },
  { Ctor: Vibrato,            label: 'vibrato', x: 0, y: 1 },
  { Ctor: Gate,               label: 'gate',    x: 1, y: 1 },
  { Ctor: Tremolo,            label: 'tremolo', x: 2, y: 1 },
  { Ctor: Panner,             label: 'pan',     x: 3, y: 1 },
  { Ctor: Arpeggiator,        label: 'arp',     x: 0, y: 2 },
  { Ctor: Knob,               label: 'knob',    x: 1, y: 2 },
  { Ctor: SwitchOn,           label: 'switch',  x: 2, y: 2 },
  { Ctor: Speaker,            label: 'speaker', x: 0, y: 3 },
];

/** Number of grid rows in the System Rack. */
const SYSTEM_RACK_ROWS = 4;
/** Gap in pixels between the bottom of the System Rack and the top of the main Rack. */
const GAP = 20;
/** Width of the mod border stroke (matches Mod.ts). */
const MOD_STROKE = 5;

export default class SystemRack {
  private rack: Rack;

  private deleteHighlight: Konva.Rect | null = null;

  constructor(rack: Rack) {
    this.rack = rack;
  }

  private get slotWidth(): number { return this.rack.slotWidth; }

  private get slotHeight(): number { return this.rack.slotHeight; }

  private get padding(): number { return this.rack.padding; }

  private get stageWidth(): number { return this.rack.stageWidth; }

  private get offsetY(): number {
    return -(SYSTEM_RACK_ROWS * this.slotHeight + 2 * this.padding + GAP);
  }

  /**
   * Returns true when the dragged mod's bounding box overlaps the delete-zone
   * slot at grid position (9, 3) in the System Rack.
   */
  isInDeleteZone(x: number, y: number, widthPx: number, heightPx: number): boolean {
    const { slotWidth, slotHeight, padding, offsetY } = this;
    const dzLeft = 9 * slotWidth + padding;
    const dzTop = offsetY + padding + 3 * slotHeight;
    return (
      x < dzLeft + slotWidth
      && x + widthPx > dzLeft
      && y < dzTop + slotHeight
      && y + heightPx > dzTop
    );
  }

  /** Show or hide the red highlight over the delete-zone slot. */
  setDeleteHighlight(visible: boolean): void {
    if (!this.deleteHighlight) return;
    if (visible) {
      this.deleteHighlight.show();
    } else {
      this.deleteHighlight.hide();
    }
    this.deleteHighlight.getLayer()?.batchDraw();
  }

  /** Draw the System Rack contents into the shared Konva layer. */
  draw(layer: Konva.Layer): void {
    const {
      slotWidth, slotHeight, padding, stageWidth, offsetY,
    } = this;
    const widthPx = stageWidth * slotWidth;
    const heightPx = SYSTEM_RACK_ROWS * slotHeight;

    // Yellow background — hover cursor signals the whole area is a delete zone
    const bg = new Konva.Rect({
      x: 0,
      y: offsetY,
      width: widthPx + 2 * padding,
      height: heightPx + 2 * padding,
      fill: '#fffde7',
    });

    layer.add(bg);

    // Grid — vertical lines
    for (let gx = 0; gx <= widthPx; gx += slotWidth) {
      layer.add(new Konva.Line({
        points: [
          gx + padding, offsetY + padding,
          gx + padding, offsetY + padding + heightPx,
        ],
        stroke: '#dddddd',
        strokeWidth: 1,
        dash: [8, 5],
      }));
    }
    // Grid — horizontal lines
    for (let gy = 0; gy <= heightPx; gy += slotHeight) {
      layer.add(new Konva.Line({
        points: [
          padding, offsetY + padding + gy,
          padding + widthPx, offsetY + padding + gy,
        ],
        stroke: '#dddddd',
        strokeWidth: 1,
        dash: [8, 5],
      }));
    }

    // Delete zone indicator: corner slot (9, 3) — bottom-right
    const dzX = 9 * slotWidth + padding;
    const dzY = offsetY + padding + 3 * slotHeight;
    layer.add(new Konva.Rect({
      x: dzX + MOD_STROKE / 2,
      y: dzY + MOD_STROKE / 2,
      width: slotWidth - MOD_STROKE,
      height: slotHeight - MOD_STROKE,
      fill: '#ef5350',
      stroke: '#c62828',
      strokeWidth: MOD_STROKE,
      cornerRadius: 0.5,
    }));
    layer.add(new Konva.Text({
      x: dzX,
      y: dzY,
      width: slotWidth,
      height: slotHeight,
      text: '\u2715',
      fontSize: 22,
      fontFamily: '"Courier New", Courier, "Lucida Sans Typewriter", "Lucida Typewriter", monospace',
      fill: 'white',
      align: 'center',
      verticalAlign: 'middle',
    }));

    // Red highlight overlay — shown while a dragged mod hovers the delete slot
    this.deleteHighlight = new Konva.Rect({
      x: dzX + MOD_STROKE / 2,
      y: dzY + MOD_STROKE / 2,
      width: slotWidth - MOD_STROKE,
      height: slotHeight - MOD_STROKE,
      fill: '#94100e',
      opacity: 0.7,
      stroke: '#851b1b',
      strokeWidth: MOD_STROKE,
      visible: false,
    });
    layer.add(this.deleteHighlight);

    // Prototype groups
    PROTOS.forEach((proto) => {
      this.drawProto(layer, proto);
    });
  }

  private drawProto(layer: Konva.Layer, proto: ProtoEntry): void {
    const { slotWidth, slotHeight, padding, offsetY } = this;

    const px = proto.x * slotWidth + padding;
    const py = offsetY + padding + proto.y * slotHeight;

    const group = new Konva.Group({ x: px, y: py });

    // Must be in the layer before drawVisual() so Konva methods like
    // getCanvas() work during custom draw() overrides (e.g. Knob)
    layer.add(group);

    // Render the mod visually — same appearance as on the main rack
    const tempMod = new proto.Ctor();
    tempMod.drawVisual(group, slotWidth, slotHeight);

    this.attachGhostDrag(layer, group, proto);
  }

  private attachGhostDrag(
    layer: Konva.Layer,
    protoGroup: Konva.Group,
    proto: ProtoEntry,
  ): void {
    const { rack, slotWidth, slotHeight, padding } = this;
    let grabOffsetX = 0;
    let grabOffsetY = 0;
    let ghost: Konva.Group | null = null;

    protoGroup.on('mouseover', () => {
      document.body.style.cursor = 'grab';
    });
    protoGroup.on('mouseout', () => {
      document.body.style.cursor = 'default';
    });

    protoGroup.on('mousedown touchstart', (e) => {
      // Prevent stage from starting a pan gesture
      e.cancelBubble = true;
      // Prevent browser scroll / default touch behaviour
      (e.evt as Event).preventDefault();
      rack.stage.draggable(false);

      const layerPos = layer.getRelativePointerPosition();
      if (!layerPos) return;

      // Record where inside the prototype the user grabbed
      grabOffsetX = layerPos.x - protoGroup.x();
      grabOffsetY = layerPos.y - protoGroup.y();

      // Snap highlight: shown on the main rack to indicate the drop target
      // Added before the ghost so it renders below it
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

      // Build the visual ghost using the mod's own visual, slightly transparent
      ghost = new Konva.Group({
        x: protoGroup.x(),
        y: protoGroup.y(),
      });
      // Must be in the layer before drawVisual() (same reason as drawProto)
      layer.add(ghost);
      const ghostMod = new proto.Ctor();
      ghostMod.drawVisual(ghost, slotWidth, slotHeight);
      layer.batchDraw();

      // Follow the pointer
      rack.stage.on('mousemove.sysghost touchmove.sysghost', (moveEvt) => {
        // Two-finger gesture: let pinch-zoom handler take over
        const moveTouch = moveEvt.evt as { touches?: TouchList };
        if (moveTouch.touches && moveTouch.touches.length >= 2) return;
        (moveEvt.evt as Event).preventDefault();
        if (!ghost) return;
        const p = layer.getRelativePointerPosition();
        if (!p) return;
        ghost.position({ x: p.x - grabOffsetX, y: p.y - grabOffsetY });

        // Update snap highlight when ghost is over the main rack area
        const gy = ghost.y();
        if (gy >= 0 && snapHighlight) {
          const gx = ghost.x();
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

      // Drop
      rack.stage.on('mouseup.sysghost touchend.sysghost', (upEvt) => {
        // Wait until all fingers are lifted
        const upTouch = upEvt.evt as { touches?: TouchList };
        if (upTouch.touches && upTouch.touches.length > 0) return;

        rack.stage.off('.sysghost');
        rack.stage.draggable(true);

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

        // Convert ghost layer-coords to main rack grid slot
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
