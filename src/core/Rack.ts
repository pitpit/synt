import Konva from 'konva';
import * as Tone from 'tone';
import Mod from './Mod';
import SystemRack from './SystemRack';

export default class Rack {
  stage: Konva.Stage;

  slotHeight: number = 100;

  slotWidth: number = 100;

  strokeWidth: number = 1;

  padding: number = 4;

  /** Stage width expressed in number of slots. */
  stageWidth: number = 10;

  /** Stage height expressed in number of slots. */
  stageHeight: number = 10;

  private _resizeListenerAdded = false;

  layer: Konva.Layer | null = null;

  systemRack: SystemRack | null = null;

  mods: Array<Mod> = [];

  grid: Array<Array<Mod|null>> = [];

  constructor() {
    // Setup container
    const container = document.createElement('div');
    container.id = 'container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    const body = document.getElementsByTagName('body')[0];
    body.style.margin = '0';
    body.style.overflow = 'hidden';
    body.appendChild(container);

    // Setup stage
    this.stage = new Konva.Stage({
      container: container.id,
    });

    // Tone.js requires a user gesture to resume the AudioContext
    // because of chrome autoplay policy.
    const resumeAudioContext = () => {
      void Tone.start().then(() => {
        document.removeEventListener('mousedown', resumeAudioContext);
        document.removeEventListener('touchstart', resumeAudioContext);
      });
    };
    document.addEventListener('mousedown', resumeAudioContext);
    document.addEventListener('touchstart', resumeAudioContext);
  }

  /**
   * Add a Mod on the rack and set its position.
   */
  add(mod: Mod, x:number, y:number): this {
    if (this.isBusy(x, y, mod)) {
      throw new Error('A mod already stand at this position');
    }
    mod.rack = this;
    mod.x = x;
    mod.y = y;
    // TODO check if not already in rack
    this.mods.push(mod);
    this.addToGrid(mod);

    return this;
  }

  private removeFromGrid(mod: Mod): this {
    // TODO use an efficient array walk
    this.grid.forEach((row, x) => {
      row.forEach((item, y) => {
        if (item === mod) {
          this.grid[x][y] = null;
          return this;
        }
        return this;
      });
      return this;
    });

    return this;
  }

  private getFromGrid(x:number, y:number): Mod|null {
    if (this.grid[x] && this.grid[x][y]) {
      return this.grid[x][y];
    }

    return null;
  }

  private addToGrid(mod:Mod): this {
    if (!this.grid[mod.x]) {
      this.grid[mod.x] = [];
    }
    this.grid[mod.x][mod.y] = mod;

    return this;
  }

  private drawGrid(layer: Konva.Layer, widthPx: number, heightPx: number): void {
    for (let x = 0; x <= widthPx; x += this.slotWidth) {
      const line = new Konva.Line({
        points: [
          x + this.padding,
          this.padding,
          x + this.padding,
          heightPx + this.padding,
        ],
        stroke: '#dddddd',
        strokeWidth: this.strokeWidth,
        dash: [8, 5],
      });
      layer.add(line);
    }
    for (let x = 0; x <= heightPx; x += this.slotHeight) {
      const line = new Konva.Line({
        points: [
          this.padding,
          x + this.padding,
          widthPx + this.padding,
          x + this.padding,
        ],
        stroke: '#dddddd',
        strokeWidth: this.strokeWidth,
        dash: [8, 5],
      });
      layer.add(line);
    }
  }

  /**
   * Draw the rack and all positionned Mods.
   * Attach events.
   */
  draw() {
    // Clear stage event handlers to prevent accumulation on re-draw
    this.stage.off('wheel').off('touchmove').off('touchend');

    const widthPx = this.stageWidth * this.slotWidth;
    const heightPx = this.stageHeight * this.slotHeight;
    const contentWidthPx = widthPx + 2 * this.padding;
    const contentHeightPx = heightPx + 2 * this.padding;

    this.stage.size({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    if (!this._resizeListenerAdded) {
      this._resizeListenerAdded = true;
      window.addEventListener('resize', () => {
        this.stage.size({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      });
    }

    const layer = new Konva.Layer();
    this.layer = layer;

    // Draw the system rack (above the main rack) if configured
    this.systemRack?.draw(layer);

    layer.add(new Konva.Rect({
      x: 0,
      y: 0,
      width: contentWidthPx,
      height: contentHeightPx,
      fill: 'white',
    }));

    // Draw grid over the content area
    this.drawGrid(
      layer,
      widthPx,
      heightPx,
    );

    this.mods.forEach((mod) => {
      this.initModInLayer(mod, layer);
    });
    this.stage.add(layer);

    // Enable single-finger pan on empty canvas areas
    this.stage.draggable(true);

    // Wheel zoom centered on pointer
    this.stage.on('wheel', (e) => {
      e.evt.preventDefault();
      const scaleBy = 1.05;
      const oldScale = this.stage.scaleX();
      const pointer = this.stage.getPointerPosition();
      if (!pointer) return;

      // Point under the cursor in stage-local coordinates
      const stageX = (pointer.x - this.stage.x()) / oldScale;
      const stageY = (pointer.y - this.stage.y()) / oldScale;

      const direction = e.evt.deltaY < 0 ? 1 : -1;
      const newScale = Math.max(0.3, Math.min(3, oldScale * (direction > 0 ? scaleBy : 1 / scaleBy)));
      this.stage.scale({ x: newScale, y: newScale });

      // Reposition so the hovered point stays stationary
      this.stage.position({
        x: pointer.x - stageX * newScale,
        y: pointer.y - stageY * newScale,
      });
    });

    // Two-finger pinch-to-zoom (centered on pinch midpoint)
    let lastDist = 0;
    this.stage.on('touchmove', (e) => {
      const { touches } = e.evt;
      if (touches.length >= 2) {
        e.evt.preventDefault();
        // Disable drag during pinch to avoid conflation
        this.stage.draggable(false);

        const t0 = touches[0];
        const t1 = touches[1];
        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);

        if (lastDist > 0) {
          const oldScale = this.stage.scaleX();
          const newScale = Math.max(0.3, Math.min(3, oldScale * (dist / lastDist)));

          // Zoom centered on the midpoint between the two fingers
          const stageX = (midX - this.stage.x()) / oldScale;
          const stageY = (midY - this.stage.y()) / oldScale;
          this.stage.scale({ x: newScale, y: newScale });

          this.stage.position({
            x: midX - stageX * newScale,
            y: midY - stageY * newScale,
          });
        }
        lastDist = dist;
      }
    });
    this.stage.on('touchend', (e) => {
      if (e.evt.touches.length < 2) {
        lastDist = 0;
        this.stage.draggable(true);
      }
    });
  }

  /**
   * Can currentMod be positionned onto the rack.
   * Depndending on its width and height
   */
  isBusy(x: number, y: number, currentMod: Mod): boolean {
    let busy = false;

    // TODO refactor using this.grid
    this.mods.forEach((mod: Mod) => {
      if (
        currentMod !== mod
        && (
          (
            x >= mod.x && x < mod.x + mod.width
            && y >= mod.y && y < mod.y + mod.height)
          || (
            mod.x >= x && mod.x < x + currentMod.width
            && mod.y >= y && mod.y < y + currentMod.height
          )
        )
      ) {
        busy = true;
      }
    });

    return busy;
  }

  /**
   * Remove all mods from the rack and reset the canvas layers.
   * Call draw() afterwards to re-render.
   */
  clear(): this {
    [...this.mods].forEach((mod) => { mod.snatch(); });
    this.mods = [];
    this.grid = [];
    this.layer = null;
    this.stage.destroyChildren();
    return this;
  }

  /**
   * Remove a single mod from the rack, disconnecting its audio graph
   * and destroying its Konva group.
   */
  remove(mod: Mod): void {
    mod.snatch();
    const idx = this.mods.indexOf(mod);
    if (idx !== -1) {
      this.mods.splice(idx, 1);
    }
    this.removeFromGrid(mod);
    mod.group?.destroy();
    this.layer?.batchDraw();
  }

  /**
   * Add a mod to the rack dynamically (without a full redraw),
   * preserving existing mod connections.
   */
  addMod(mod: Mod, x: number, y: number): void {
    if (!this.layer) return;
    this.add(mod, x, y);
    this.initModInLayer(mod, this.layer);
    mod.plug([
      this.getFromGrid(mod.x, mod.y - 1), // North
      this.getFromGrid(mod.x + 1, mod.y), // East
      this.getFromGrid(mod.x, mod.y + 1), // South
      this.getFromGrid(mod.x - 1, mod.y), // West
    ]);
    this.layer.batchDraw();
  }

  private initModInLayer(mod: Mod, layer: Konva.Layer): void {
    const group = new Konva.Group({
      draggable: true,
    });

    mod.events.on('dragstart', () => {
      mod.snatch();
    });

    mod.events.on('dragend', () => {
      // Keep internal grid up to date
      this.removeFromGrid(mod).addToGrid(mod);

      mod.plug([
        this.getFromGrid(mod.x, mod.y - 1), // North
        this.getFromGrid(mod.x + 1, mod.y), // East
        this.getFromGrid(mod.x, mod.y + 1), // South
        this.getFromGrid(mod.x - 1, mod.y), // West
      ]);
    });

    mod.events.on('delete', () => {
      const group = mod.group;
      if (!group) {
        this.remove(mod);
        return;
      }

      const w = mod.width * this.slotWidth;
      const h = mod.height * this.slotHeight;

      // Shift origin to center so the squish scales from the middle
      group.offsetX(w / 2);
      group.offsetY(h / 2);
      group.x(group.x() + w / 2);
      group.y(group.y() + h / 2);
      group.draggable(false);
      group.moveToTop();
      this.layer?.batchDraw();

      // Phase 1: squish (spread wide, flatten tall)
      const squish = new Konva.Tween({
        node: group,
        duration: 0.08,
        scaleX: 1.3,
        scaleY: 0.5,
        easing: Konva.Easings.EaseIn,
        onFinish: () => {
          squish.destroy();
          // Phase 2: crunch to nothing
          const crunch = new Konva.Tween({
            node: group,
            duration: 0.14,
            scaleX: 0,
            scaleY: 0,
            easing: Konva.Easings.EaseIn,
            onFinish: () => {
              crunch.destroy();
              this.remove(mod);
            },
          });
          crunch.play();
        },
      });
      squish.play();
    });

    layer.add(group);
    mod.init(
      this.slotWidth,
      this.slotHeight,
      this.padding,
      group,
      this.stageWidth,
      this.stageHeight,
    );

    mod.events.on('checkDeleteZone', (x, y, w, h, result) => {
      result.inDeleteZone = this.systemRack?.isInDeleteZone(x, y, w, h) ?? false;
    });
    mod.events.on('deleteZoneChange', (isIn) => {
      this.systemRack?.setDeleteHighlight(isIn);
    });
  }
}
