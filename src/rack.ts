import Mod from './mod';
import Konva from 'konva';
import PlugPosition from './plug-position';
import PlugType from './plug-type';
import Modal from './modal';

export default class Rack {
  audioContext: AudioContext;
  stage: Konva.Stage;
  slotHeight: number = 100;
  slotWidth: number = 100;
  strokeWidth: number = 1;
  padding: number = 10;
  mods:Array<Mod> = [];
  grid:Array<Array<Mod|null>> = [];

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

    // We cannot initialize the AudioContext in constructor
    // because of chrome autoplay policy:
    //  https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
    this.audioContext = new AudioContext();
    const resumeAudioContext = () => {
      this.audioContext.resume().then(() => {
        document.removeEventListener('mousedown', resumeAudioContext);
      });
    };
    document.addEventListener('mousedown', resumeAudioContext);
  }
  /**
   * Add a Mod on the rack and set its position.
   */
  add(mod:Mod, x:number, y:number): Rack {
    if (this.isBusy(x, y, mod)) {
      throw new Error('A mod already stand at this position');
    }
    mod.setRack(this);
    mod.setAudioContext(this.audioContext);
    mod.setPosition(x, y);
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
   * @private
   */
  _drawGrid(layer: Konva.Layer, widthPx: number, heightPx: number): void {
    for (let x = 0; x <= widthPx; x += this.slotWidth) {
      const line = new Konva.Line({
        points: [
          this.strokeWidth + x + this.padding,
          this.padding,
          this.strokeWidth+ x + this.padding,
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
          this.strokeWidth + x + this.padding,
          widthPx + this.padding,
          this.strokeWidth+ x + this.padding,
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
    // Set canvas to screen size
    const widthPx = window.innerWidth;
    const heightPx = window.innerHeight;

    this.stage.size({
      width: widthPx,
      height: heightPx,
    });

    const layer = new Konva.Layer();

    this._drawGrid(layer, widthPx, heightPx);

    this.mods.forEach((mod, index) => {
      const group = new Konva.Group({
        draggable: true,
      });

      mod.events.on('dragstart', () => {
        // Unlink all io plugs
        mod.unlink(PlugPosition.NORTH);
        mod.unlink(PlugPosition.EAST);
        mod.unlink(PlugPosition.SOUTH);
        mod.unlink(PlugPosition.WEST);
      });

      mod.events.on('dragend', () => {
        // Keep internal grid up to date
        this._removeFromGrid(mod)._addToGrid(mod);

        // Try to link Mods
        mod.link(PlugPosition.NORTH, this._getFromGrid(mod.x, mod.y - 1));
        mod.link(PlugPosition.EAST, this._getFromGrid(mod.x+1, mod.y));
        mod.link(PlugPosition.SOUTH, this._getFromGrid(mod.x, mod.y + 1));
        mod.link(PlugPosition.WEST, this._getFromGrid(mod.x-1, mod.y));
      });

      mod.events.on('dblclick', () => {
        new Modal().open();
      });

      layer.add(group);
      mod.superDraw(this.slotWidth, this.slotHeight, this.padding, group);
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
