import Mod from './mod';
import Konva from 'konva/lib/Core';
import { Line } from 'konva/lib/shapes/Line.js';
import { Rect } from 'konva/lib/shapes/Rect.js';

export default class Rack {
  stage;
  width:number;
  height:number;
  slotHeight: number = 100;
  slotWidth: number = 100;
  padding: number = 10;
  mods:Array<Mod> = [];

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

    // Set fullscreen size
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    // this.width = this.padding *2 +this.slotWidth * 10;
    // this.height =this.padding *2 +this.slotWidth * 10;

    this.stage = new Konva.Stage({
      container: container.id,
      width: this.width,
      height: this.height,
    });

    const layer = new Konva.Layer();

    // Draw grid
    const strokeWidth = 1;
    for (let x = 0; x <= this.width; x += this.slotWidth) {
      const line = new Line({
        points: [
          strokeWidth + x + this.padding,
          this.padding,
          strokeWidth+ x + this.padding,
          this.height + this.padding,
        ],
        stroke: '#dddddd',
        strokeWidth,
        dash: [8, 5],
      });
      layer.add(line);
    }
    for (let x = 0; x <= this.height; x += this.slotHeight) {
      const line = new Line({
        points: [
          this.padding,
          strokeWidth + x + this.padding,
          this.width + this.padding,
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

    // let body = document.getElementsByTagName('body')[0];

    // // to do this we need to scale the stage
    // let scale = window.innerWidth / this.width;

    // this.stage.width(this.width * scale);
    // this.stage.height(this.height * scale);
    // this.stage.scale({ x: scale, y: scale });
    // this.stage.draw();
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
