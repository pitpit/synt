import Mod from './mod';
import Konva from 'konva/lib/index-umd.js';
import * as Pizzicato from 'pizzicato';
import Cardinal from './cardinal';

export default class Rack {
  stage: Konva.Stage|null = null;
  slotHeight: number = 100;
  slotWidth: number = 100;
  padding: number = 10;
  mods:Array<Mod> = [];
  grid:Array<Array<Mod|null>> = [];

  /**
   * Add a Mod on the rack and set its position.
   */
  add(mod:Mod, x:number, y:number): Rack {
    if (this.isBusy(x, y, mod)) {
      throw new Error('A mod already stand at this position');
    }
    mod.setRack(this, x, y);
    // TODO check if not already in rack
    this.mods.push(mod);
    this._addToGrid(mod);

    return this;
  }

  /**
   * @private
   */
  _removeFromGrid(mod: Mod): Rack {
    // TODO use an efficient array walk
    this.grid.forEach((row, x) => {
      row.forEach((item, y) => {
        if (item === mod) {
          this.grid[x][y] = null;
          return this;
        }
      });
    });

    return this;
  }

  /**
   * @private
   */
  _getFromGrid(x:number, y:number): Mod|null {
    if (this.grid[x] && this.grid[x][y]) {
      return this.grid[x][y];
    }

    return null;
  }

  /**
   * @private
   */
  _addToGrid(mod:Mod): Rack {
    if (!this.grid[mod.x]) {
      this.grid[mod.x] = [];
    }
    this.grid[mod.x][mod.y] = mod;

    return this;
  }

  /**
   * Draw the rack and all positionned Mods
   */
  draw() {
    // Setup container
    const container = document.createElement('div');
    container.id = 'container';
    const body = document.getElementsByTagName('body')[0];
    body.style.margin = '0';
    body.style.overflow = 'hidden';
    body.appendChild(container);

    // Set canvas to screen size
    const widthPx = window.innerWidth;
    const heightPx = window.innerHeight;

    this.stage = new Konva.Stage({
      container: container.id,
      width: widthPx,
      height: heightPx,
    });

    const layer = new Konva.Layer();

    // Draw grid
    const strokeWidth = 1;
    for (let x = 0; x <= widthPx; x += this.slotWidth) {
      const line = new Konva.Line({
        points: [
          strokeWidth + x + this.padding,
          this.padding,
          strokeWidth+ x + this.padding,
          heightPx + this.padding,
        ],
        stroke: '#dddddd',
        strokeWidth,
        dash: [8, 5],
      });
      layer.add(line);
    }
    for (let x = 0; x <= heightPx; x += this.slotHeight) {
      const line = new Konva.Line({
        points: [
          this.padding,
          strokeWidth + x + this.padding,
          widthPx + this.padding,
          strokeWidth+ x + this.padding,
        ],
        stroke: '#dddddd',
        strokeWidth,
        dash: [8, 5],
      });
      layer.add(line);
    }

    this.mods.forEach((mod, index) => {
      const group = new Konva.Group({
        draggable: true,
      });

      mod.events.on('moved', () => {
        this._removeFromGrid(mod)._addToGrid(mod);

        mod.link(Cardinal.NORTH, this._getFromGrid(mod.x, mod.y - 1));
        mod.link(Cardinal.EAST, this._getFromGrid(mod.x+1, mod.y));
        mod.link(Cardinal.SOUTH, this._getFromGrid(mod.x, mod.y + 1));
        mod.link(Cardinal.WEST, this._getFromGrid(mod.x-1, mod.y));

        // Re-tune every mod
        this.mods.forEach((mod, index) => {
          const tuneGroup = new Pizzicato.Group();
          mod.tune(tuneGroup);
        });
      });
      layer.add(group);
      mod.draw(group);
    });
    this.stage.add(layer);

    // Resize canvas when resizing window
    const instance = this;
    window.onresize = () => {
      if (instance.stage){
        instance.stage.width(window.innerWidth);
        instance.stage.height(window.innerHeight);
      }
    };
  }

  /**
   * Can currentMod be positionned onto the rack.
   * Depndending on its width and height
   */
  isBusy(x: number, y: number, currentMod: Mod): boolean {
    let busy = false;

    // TODO refactor using this.grid
    this.mods.forEach((mod, index) => {
      if (
        currentMod !== mod &&
        (
          (
            x >= mod.x && x < mod.x + mod.width &&
            y >= mod.y && y < mod.y + mod.height) ||
          (
            mod.x >= x && mod.x < x + currentMod.width &&
            mod.y >= y && mod.y < y + currentMod.height
          )
        )
      ) {
        busy = true;
      }
    });

    return busy;
  }
}
