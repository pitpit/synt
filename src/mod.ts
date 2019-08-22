import Rack from './rack';
import { Rect } from 'konva/lib/shapes/Rect.js';

export default class Mod {
  height: number;
  width: number;
  x: number;
  y: number;
  rack:Rack;

  constructor(
    x:number = 0,
    y:number = 0,
    width:number = 1,
    height:number = 1) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  setRack(rack) {
    this.rack = rack;
  }

  draw(group: any){
    const strokeWidth = 5;

    group.position({
      x: this.x * this.rack.slotWidth + this.rack.padding,
      y: this.y * this.rack.slotHeight + this.rack.padding,
    });

    group.size({
      width: this.width * this.rack.slotWidth,
      height: this.height * this.rack.slotHeight,
    });

    const rect = new Rect({
      x: 0 + strokeWidth/2,
      y: 0 + strokeWidth/2,
      width:  this.width * this.rack.slotWidth - strokeWidth,
      height: this.height * this.rack.slotHeight - strokeWidth,
      fill: 'white',
      stroke: 'black',
      strokeWidth,
      cornerRadius: 0.5,
    });
    group.add(rect);

    // Draw drag and drop shadow
    // See https://codepen.io/pierrebleroux/pen/gGpvxJ

    let targetX = this.x;
    let targetY = this.y;
    const dragRect = new Rect({
      x: targetX * this.rack.slotWidth + this.rack.padding + strokeWidth/2,
      y: targetY * this.rack.slotHeight + this.rack.padding + strokeWidth/2,
      width:  this.width * this.rack.slotWidth,
      height: this.height * this.rack.slotHeight,
      fill: '#cccccc',
      opacity: 0.6,
      stroke: '#dddddd',
      strokeWidth: 1,
    });
    dragRect.hide();
    group.getLayer().add(dragRect);

    group.on('mouseover', () => {
      document.body.style.cursor = 'pointer';
    });
    group.on('mouseout', () => {
      document.body.style.cursor = 'default';
    });

    group.on('dragstart', (e) => {
      dragRect.show();
      dragRect.moveToTop();
      group.moveToTop();
    });

    group.on('dragend', (e) => {
      let x = Math.round(group.x() / this.rack.slotWidth);
      let y = Math.round(group.y() / this.rack.slotHeight);
      x = x > 0 ? x : 0;
      y = y > 0 ? y : 0;

      if (this.rack.isBusy(x, y, this)) {
        // Send back mod to prior slot
        this.x = targetX;
        this.y = targetY;
      } else {
        this.x = x;
        this.y = y;
      }
      group.position({
        x: this.rack.padding + this.x * this.rack.slotWidth,
        y: this.rack.padding + this.y * this.rack.slotHeight,
      });
      targetX = this.x;
      targetY = this.y;
      dragRect.hide();
      dragRect.position({
        x: this.rack.padding + targetX * this.rack.slotWidth,
        y: this.rack.padding + targetY * this.rack.slotHeight,
      });
      group.getStage().batchDraw();
    });

    group.on('dragmove', (e) => {
      let x = Math.round(group.x() / this.rack.slotWidth);
      let y = Math.round(group.y() / this.rack.slotHeight);
      x = x > 0 ? x : 0;
      y = y > 0 ? y : 0;

      if (!this.rack.isBusy(x, y, this)) {
        targetX = x;
        targetY = y;
        dragRect.position({
          x: this.rack.padding + targetX * this.rack.slotWidth,
          y: this.rack.padding + targetY * this.rack.slotHeight,
        });
        group.getStage().batchDraw();
      }
    });
  }
}
