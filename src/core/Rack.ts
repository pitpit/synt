import Konva from 'konva';
import * as Tone from 'tone';
import Mod from './Mod';

export default class Rack {
  stage: Konva.Stage;

  slotHeight: number = 100;

  slotWidth: number = 100;

  strokeWidth: number = 1;

  padding: number = 4;

  /** Stage width and height expressed in number of slots. */
  stageSize: number = 10;

  mods: Array<Mod> = [];

  grid: Array<Array<Mod|null>> = [];

  constructor() {
    // Setup container
    const container = document.createElement('div');
    container.id = 'container';
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
    const innerPx = this.stageSize * this.slotWidth;
    const stagePx = innerPx + 2 * this.padding;

    this.stage.size({
      width: stagePx,
      height: stagePx,
    });

    const layer = new Konva.Layer();

    layer.add(new Konva.Rect({
      x: 0,
      y: 0,
      width: stagePx,
      height: stagePx,
      fill: 'white',
    }));

    // Draw grid over the full stage area
    this.drawGrid(
      layer,
      innerPx,
      innerPx,
    );

    this.mods.forEach((mod) => {
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

      layer.add(group);
      mod.init(this.slotWidth, this.slotHeight, this.padding, group);
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
}
