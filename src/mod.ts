import Rack from './rack';
import IO from './io';
import { Rect } from 'konva/lib/shapes/Rect.js';
import { Line } from 'konva/lib/shapes/Line.js';
import { Text } from 'konva/lib/shapes/Text.js';
import * as EventEmitter from 'eventemitter3';

export default class Mod {
  height: number;
  width: number;
  x: number;
  y: number;
  io:Array<Symbol>;
  rack:Rack;
  events:EventEmitter;
  fromX: number;
  fromY: number;
  label: string = '';

  constructor(
    x:number = 0,
    y:number = 0,
    width:number = 1,
    height:number = 1,
    io:Array<Symbol> = [IO.NULL, IO.NULL, IO.NULL, IO.NULL],
  ){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    // TODO validate io
    this.io = io;
    this.io = [...this.io, ...Array(4-this.io.length).fill(IO.NULL)];
    this.events = new EventEmitter();
  }

  setRack(rack) {
    this.rack = rack;
  }

  drawIOLine(io: Symbol, cardinal:number, strokeWidth: number) {
    const ioLineStrokeWidth = 5;
    const color = (IO.IN === io) ? 'green' : ((IO.OUT === io) ? 'red': 'gray');
    let points: Array<number> = [0, 0, 0, 0];

    if (0 === cardinal) {
      points = [
        strokeWidth,
        strokeWidth + ioLineStrokeWidth/2,
        this.rack.slotWidth - strokeWidth,
        strokeWidth+ ioLineStrokeWidth/2,
      ];
    } else if (1 === cardinal) {
      points = [
        this.width * this.rack.slotWidth - (strokeWidth + ioLineStrokeWidth/2),
        strokeWidth,
        this.width * this.rack.slotWidth - (strokeWidth + ioLineStrokeWidth/2),
        this.height * this.rack.slotHeight - strokeWidth,
      ];
    } else if (2 === cardinal) {
      points = [
        strokeWidth,
        this.width * this.rack.slotWidth - (strokeWidth + ioLineStrokeWidth/2),
        this.rack.slotWidth - strokeWidth,
        this.width * this.rack.slotWidth - (strokeWidth + ioLineStrokeWidth/2),
      ];
    } else if (3 === cardinal) {
      points = [
        strokeWidth+ ioLineStrokeWidth/2,
        strokeWidth,
        strokeWidth+ ioLineStrokeWidth/2,
        this.height * this.rack.slotHeight - strokeWidth,
      ];
    } else {
      throw new Error('Invalid cardinal value');
    }

    const ioLine = new Line({
      points,
      stroke: color,
      strokeWidth: ioLineStrokeWidth,
      lineCap: 'sqare',
    });

    return ioLine;
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

    if (this.label) {
      const text = new Text({
        x: 0,
        y: 0,
        width: group.width(),
        height: group.height(),
        text: this.label,
        fontSize: 14,
        fontFamily: '"Courier New", Courier, "Lucida Sans Typewriter", "Lucida Typewriter", monospace',
        fill: 'black',
        align: 'center',
        verticalAlign: 'middle',
      });
      group.add(text);
    }

    // North IO
    if (IO.NULL !== this.io[0]) {
      const ioLine = this.drawIOLine(this.io[0], 0, strokeWidth);
      group.add(ioLine);
    }

    // East IO
    if (IO.NULL !== this.io[1]) {
      const ioLine = this.drawIOLine(this.io[2], 1, strokeWidth);
      group.add(ioLine);
    }

    // South IO
    if (IO.NULL !== this.io[2]) {
      const ioLine = this.drawIOLine(this.io[2], 2, strokeWidth);
      group.add(ioLine);
    }

    // West IO
    if (IO.NULL !== this.io[3]) {
      const ioLine = this.drawIOLine(this.io[3], 3, strokeWidth);
      group.add(ioLine);
    }

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

      // Keep previous position to pass it to moved event
      this.fromX = this.x;
      this.fromY = this.y;
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

      this.events.emit('moved', this.fromX, this.fromY, this.x, this.y);
      this.fromX = null;
      this.fromY = null;
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
