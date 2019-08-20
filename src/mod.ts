export default class Mod {
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

  draw(ctx:CanvasRenderingContext2D) {
    ctx.lineWidth = 10;
    this.roundRect(ctx, 400, 300, 200, 100, 0.5);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.stroke();
  }
}
