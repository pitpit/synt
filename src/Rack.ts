import Konva from 'konva';
// import { AudioContext } from 'standardized-audio-context';
import Gibberish from 'gibberish-dsp';
import Mod from './Mod';
import Modal from './Modal';
// import AudioMod from './AudioMod';

export default class Rack {
  // audioContext: AudioContext;

  stage: Konva.Stage;

  slotHeight: number = 100;

  slotWidth: number = 100;

  strokeWidth: number = 1;

  padding: number = 10;

  mods: Array<Mod> = [];

  grid: Array<Array<Mod|null>> = [];

  gibberish: any;

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
    // because of chrome autoplay policy.
    // this.audioContext = new AudioContext();
    window.Gibberish = Gibberish;
    Gibberish.init();

    // const resumeAudioContext = () => {
    //   this.audioContext.resume().then(() => {
    //     document.removeEventListener('mousedown', resumeAudioContext);
    //   });
    // };
    // document.addEventListener('mousedown', resumeAudioContext);
  }

  /**
   * Add a Mod on the rack and set its position.
   */
  add(mod: Mod, x:number, y:number): Rack {
    if (this.isBusy(x, y, mod)) {
      throw new Error('A mod already stand at this position');
    }
    mod.rack = this;
    mod.x = x;
    mod.y = y;
    // if (mod instanceof AudioMod) {
    //   mod.audioContext = this.audioContext;
    // }
    // TODO check if not already in rack
    this.mods.push(mod);
    this.addToGrid(mod);

    return this;
  }

  private removeFromGrid(mod: Mod): Rack {
    // TODO use an efficient array walk
    this.grid.forEach((row, x) => {
      row.forEach((item, y): any => {
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

  private addToGrid(mod:Mod): Rack {
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
          this.strokeWidth + x + this.padding,
          this.padding,
          this.strokeWidth + x + this.padding,
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
          this.strokeWidth + x + this.padding,
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

    this.drawGrid(layer, widthPx, heightPx);

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
          this.getFromGrid(mod.x - 1, mod.y), // South
        ]);

        // Go back following the link chain to find entries
        // look for mods with at least one linked OUT plug or one linked CTRLOUT plug
        // and with no linked mods on IN plug or a CTRLIN plug
        mod.findEntries().forEach((currentMod) => {
          currentMod.start();
        });
      });

      mod.events.on('dblclick', () => {
        new Modal().open();
      });

      layer.add(group);
      mod.init(this.slotWidth, this.slotHeight, this.padding, group);
    });
    this.stage.add(layer);

    // Resize canvas when resizing window
    const instance = this;
    window.onresize = () => {
      if (instance.stage) {
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
