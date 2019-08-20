import Mod from "./mod";

export default class Rack {
  canvas: HTMLCanvasElement;
  context2d: CanvasRenderingContext2D;
  slotHeight: number = 100;
  slotWidth: number = 100;
  padding: number = 10;
  mods:Array<Mod> = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'rack-canvas';
    if (this.canvas.getContext) {
      this.context2d = this.canvas.getContext('2d');
    }
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

    if (this.context2d) {
      const ctx = this.context2d;
      // Box width
      const bw = this.canvas.width;
      // Box height
      const bh = this.canvas.height;

      const thickness = 0.5;

      ctx.save();
      // ctx.beginPath();

      ctx.strokeStyle = "#bbbbbb";
      ctx.lineWidth = thickness;
      ctx.setLineDash([8, 5]);/*dashes are 5px and spaces are 3px*/

      for (var x = 0; x <= bw; x += this.slotWidth) {
        ctx.moveTo(thickness + x + this.padding, this.padding);
        ctx.lineTo(thickness+ x + this.padding, bh + this.padding);
      }
      
      for (var x = 0; x <= bh; x += this.slotHeight) {
        ctx.moveTo(this.padding, thickness + x + this.padding);
        ctx.lineTo(bw + this.padding, thickness+ x + this.padding);
      }
      // ctx.closePath();
      ctx.stroke();

      this.mods.forEach((mod, index) => {
        ctx.restore();
        mod.draw(this);
      });
    }
  }
}
