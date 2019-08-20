import Mod from "./mod";
import { createContext } from "vm";

class Rack {
  canvas: HTMLCanvasElement;
  mods:Array<Mod>;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'rack-canvas';
    this.mods = [];
  }

  addMod(mod:Mod) {
    this.mods.push(mod);
  }
  
  draw() {
    // See https://blog.codepen.io/2013/07/29/full-screen-canvas/
    const body = document.getElementsByTagName('body')[0];
    body.style.margin = '0';
    body.style.overflow = 'hidden';
    body.appendChild(this.canvas);

    this.redraw();
    
    //resize canvas when resizing window
    let instance = this;
    window.onresize = function() {
      instance.redraw();
    }
  }
  
  redraw() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    if (this.canvas.getContext) {
      const ctx = this.canvas.getContext('2d');
      // Box width
      const bw = this.canvas.width;
      // Box height
      const bh = this.canvas.height;
      // Padding
      const p = 10;
      
      const thickness = 0.5;

      ctx.save();
      // ctx.beginPath();

      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = thickness;
      ctx.setLineDash([5, 3]);/*dashes are 5px and spaces are 3px*/

      for (var x = 0; x <= bw; x += 100) {
        ctx.moveTo(thickness + x + p, p);
        ctx.lineTo(thickness+ x + p, bh + p);
      }
      
      for (var x = 0; x <= bh; x += 100) {
        ctx.moveTo(p, thickness + x + p);
        ctx.lineTo(bw + p, thickness+ x + p);
      }
      // ctx.closePath();
      ctx.stroke();

      this.mods.forEach((mod, index) => {
        ctx.restore();
        mod.draw(ctx);
      });
    }
  }
}

const instance = new Rack();
export default instance;
