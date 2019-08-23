import Mod from './mod';
import Konva from 'konva/lib/Core';
import { Line } from 'konva/lib/shapes/Line.js';
import * as Pizzicato from 'pizzicato';

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
    mod.setRack(this);
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
    const strokeWidth = 1;console.log(widthPx);
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

    // this.stage.add(layer);

    // var layer = new Konva.Layer();
    this.mods.forEach((mod, index) => {
      const group = new Konva.Group({
        draggable: true,
      });

      // TODO create a dragend event on Mod and listen to it
      group.on('dragend', (e) => {
        console.log('dragend');
        // console.log(mod.x);
        // this.grid[mod.x][mod.y] = mod;
      });
      layer.add(group);
      mod.draw(group);
    });
    this.stage.add(layer);

    // Resize canvas when resizing window
    const instance = this;
    window.onresize = function() {
      instance.resize();
    };
  }

  resize() {
    this.stage.width(window.innerWidth);
    this.stage.height(window.innerHeight);
  }

  isBusy(x: number, y: number, currentMod: Mod): boolean {
    let busy = false;
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
