import Rack from "./rack";

export default class Mod {
  height: number = 2;
  width: number = 3;
  constructor() {
  }

  roundRect = function(ctx, x, y, w, h, r): CanvasRenderingContext2D {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;

    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y,   x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x,   y+h, r);
    ctx.arcTo(x,   y+h, x,   y,   r);
    ctx.arcTo(x,   y,   x+w, y,   r);
    ctx.closePath();

    return ctx;
  }

  draw(rack: Rack) {
    const ctx = rack.context2d;
    const thickness = 10;
    ctx.lineWidth = thickness;
    this.roundRect(ctx, rack.slotWidth + rack.padding + thickness/2, rack.slotHeight + rack.padding + thickness/2, this.width * rack.slotWidth - thickness, this.height * rack.slotHeight - thickness, 0.5);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.stroke();
  }
}
