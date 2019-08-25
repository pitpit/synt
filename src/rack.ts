import Mod from './mod';
import Konva from 'konva/lib/Core';
import { Line } from 'konva/lib/shapes/Line.js';
import * as Pizzicato from 'pizzicato';
import IO from './io';

export default class Rack {
  stage;
  slotHeight: number = 100;
  slotWidth: number = 100;
  padding: number = 10;
  mods:Array<Mod> = [];
  grid:Mod[][] = [];

  add(mod:Mod) {
    // TODO check if not already in rack
    this.mods.push(mod);
    this._addToGrid(mod);

    mod.setRack(this);
  }

  _removeFromGrid(mod: Mod) {
    // TODO use an efficient array walk
    this.grid.forEach((row, x) => {
      row.forEach((item, y) => {
        if (item === mod ) {
          this.grid[x][y] = null;
          return;
        }
      });
    });
  }

  _getFromGrid(x:number, y:number) {
    if (this.grid[x] && this.grid[x][y]) {
      return this.grid[x][y];
    }

    return null;
  }

  _addToGrid(mod:Mod) {
    if (!this.grid[mod.x]) {
      this.grid[mod.x] = [];
    }
    this.grid[mod.x][mod.y] = mod;
  }

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
      const line = new Line({
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
      const line = new Line({
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
        this._removeFromGrid(mod);
        this._addToGrid(mod);

        const northSiblingMod = this._getFromGrid(mod.x, mod.y - 1);
        const eastSiblingMod = this._getFromGrid(mod.x+1, mod.y);
        const southSiblingMod = this._getFromGrid(mod.x, mod.y + 1);
        const westSiblingMod = this._getFromGrid(mod.x-1, mod.y);
        if (mod.io[0] !== IO.NULL
          && northSiblingMod
          && northSiblingMod.io[2] !== IO.NULL
          && mod.io[0] !== northSiblingMod.io[2]) {

          mod.events.emit('linked-to-north', northSiblingMod);
          northSiblingMod.events.emit('linked-to-south', mod);
        } else if (mod.io[1] !== IO.NULL
          && eastSiblingMod
          && eastSiblingMod.io[3] !== IO.NULL
          && mod.io[1] !== eastSiblingMod.io[3]) {

          mod.events.emit('linked-to-east', eastSiblingMod);
          eastSiblingMod.events.emit('linked-to-west', mod);
        } else if (mod.io[2] !== IO.NULL
          && southSiblingMod
          && southSiblingMod.io[0] !== IO.NULL
          && mod.io[2] !== southSiblingMod.io[0]) {

          mod.events.emit('linked-to-south', southSiblingMod);
          southSiblingMod.events.emit('linked-to-north', mod);
        } else if (mod.io[3] !== IO.NULL
          && westSiblingMod
          && westSiblingMod.io[1] !== IO.NULL
          && mod.io[3] !== westSiblingMod.io[1]) {

          mod.events.emit('linked-to-west', westSiblingMod);
          westSiblingMod.events.emit('linked-to-east', mod);
        }
        // TODO if linked
      });
      layer.add(group);
      mod.draw(group);
    });
    this.stage.add(layer);

    // Resize canvas when resizing window
    const instance = this;
    window.onresize = () => {
      instance.resize();
    };
  }

  resize() {
    this.stage.width(window.innerWidth);
    this.stage.height(window.innerHeight);
  }

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
