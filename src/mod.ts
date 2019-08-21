import Rack from "./rack";
import { Rect } from 'konva/lib/shapes/Rect.js';

export default class Mod {
  height: number = 2;
  width: number = 3;
  constructor() {
  }

  draw(rack: any, layer: any){
    const strokeWidth = 10;

    var rect = new Rect({
      x: rack.slotWidth + rack.padding + strokeWidth/2,
      y: rack.slotHeight + rack.padding + strokeWidth/2,
      width:  this.width * rack.slotWidth - strokeWidth,
      height: this.height * rack.slotHeight - strokeWidth,
      fill: 'white',
      stroke: 'black',
      strokeWidth: strokeWidth,
      cornerRadius: 0.5,
      draggable: true
    });

    layer.add(rect);

    // Draw drag and drop shadow
    // See https://codepen.io/pierrebleroux/pen/gGpvxJ
    var blockSnapSize = 100;
    var dragRect = new Rect({
      x: 0,
      y: 0,
      width:  this.width * rack.slotWidth,
      height: this.height * rack.slotHeight,
      fill: '#cccccc',
      opacity: 0.6,
      stroke: '#dddddd',
      strokeWidth: 1,
      // dash: [20, 2]
    });
    dragRect.hide();
    layer.add(dragRect);
    rect.on('dragstart', (e) => {
      dragRect.show();
      dragRect.moveToTop();
      rect.moveToTop();
    });
    rect.on('dragend', (e) => {
      let x = rack.padding + Math.round(rect.x() / rack.slotWidth) * rack.slotWidth + strokeWidth/2;
      let y =  rack.padding + Math.round(rect.y() / rack.slotHeight) * rack.slotHeight + strokeWidth/2;
      x = x > rack.padding ? x : rack.padding + strokeWidth/2;
      y = y > rack.padding ? y : rack.padding  + strokeWidth/2;

      rect.position({
        x: x,
        y: y
      });
      rack.stage.batchDraw();
      dragRect.hide();
    });
    rect.on('dragmove', (e) => {
      let x = rack.padding + Math.round(rect.x() / rack.slotWidth) * rack.slotWidth;
      let y =  rack.padding + Math.round(rect.y() / rack.slotHeight) * rack.slotHeight;
      x = x > rack.padding ? x : rack.padding;
      y = y > rack.padding ? y : rack.padding;
      dragRect.position({
        x: x,
        y: y
      });
      rack.stage.batchDraw();
    });
  }
}
