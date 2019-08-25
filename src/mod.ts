import Rack from './rack';
import ioType from './ioType';
import Cardinal from './cardinal';
import Konva from 'konva/lib/index-umd.js';
import * as EventEmitter from 'eventemitter3';
import * as Pizzicato from 'pizzicato';

export default class Mod {
  x:number = 0;
  y:number = 0;
  height:number;
  width:number;
  ioTypes:Array<Symbol>;
  io:Array<Mod> = [];
  rack:Rack|null = null;
  events:EventEmitter;
  fromX:number = 0;
  fromY:number = 0;
  label:string = '';

  constructor(
    width:number = 1,
    height:number = 1,
    ioTypes:Array<Symbol> = [ioType.NULL, ioType.NULL, ioType.NULL, ioType.NULL],
  ){
    this.width = width;
    this.height = height;

    // TODO validate io
    this.ioTypes = ioTypes;
    this.ioTypes = [...this.ioTypes, ...Array(4-this.ioTypes.length).fill(ioType.NULL)];
    this.events = new EventEmitter();
  }

  /**
   * Set parent rack where this mod stands
   */
  setRack(rack: Rack) {
    this.rack = rack;

    return this;
  }

  /**
   * Set slot position of this mod on the rack
   */
  setPosition(x:number, y:number) {
    this.x = x;
    this.y = y;

    return this;
  }

  // getSibling(cardinal: Cardinal) {

  // }

  /**
   * Draw input/output type indicator
   * @private
   */
  _drawIOLine(io: ioType, cardinal: Cardinal, strokeWidth: number) {
    if (!this.rack) {
      throw new Error('Mod is not attached to a rack');
    }

    const ioLineStrokeWidth = 5;
    const color = (ioType.IN === io) ? 'green' : ((ioType.OUT === io) ? 'red': 'gray');
    let points: Array<number> = [0, 0, 0, 0];

    if (Cardinal.NORTH === cardinal) {
      points = [
        strokeWidth,
        strokeWidth + ioLineStrokeWidth/2,
        this.rack.slotWidth - strokeWidth,
        strokeWidth+ ioLineStrokeWidth/2,
      ];
    } else if (Cardinal.EAST === cardinal) {
      points = [
        this.width * this.rack.slotWidth - (strokeWidth + ioLineStrokeWidth/2),
        strokeWidth,
        this.width * this.rack.slotWidth - (strokeWidth + ioLineStrokeWidth/2),
        this.height * this.rack.slotHeight - strokeWidth,
      ];
    } else if (Cardinal.SOUTH === cardinal) {  // South
      points = [
        strokeWidth,
        this.width * this.rack.slotWidth - (strokeWidth + ioLineStrokeWidth/2),
        this.rack.slotWidth - strokeWidth,
        this.width * this.rack.slotWidth - (strokeWidth + ioLineStrokeWidth/2),
      ];
    } else if (Cardinal.WEST === cardinal) { // West
      points = [
        strokeWidth+ ioLineStrokeWidth/2,
        strokeWidth,
        strokeWidth+ ioLineStrokeWidth/2,
        this.height * this.rack.slotHeight - strokeWidth,
      ];
    } else {
      throw new Error('Invalid cardinal value');
    }

    const ioLine = new Konva.Line({
      points,
      stroke: color,
      strokeWidth: ioLineStrokeWidth,
      lineCap: 'sqare',
    });

    return ioLine;
  }

  draw(group:Konva.Group){
    if (!this.rack) {
      throw new Error('Mod is not attached to a rack');
    }

    const strokeWidth = 5;

    group.position({
      x: this.x * this.rack.slotWidth + this.rack.padding,
      y: this.y * this.rack.slotHeight + this.rack.padding,
    });

    group.size({
      width: this.width * this.rack.slotWidth,
      height: this.height * this.rack.slotHeight,
    });

    const rect = new Konva.Rect({
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
      const text = new Konva.Text({
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
    if (ioType.NULL !== this.ioTypes[Cardinal.NORTH]) {
      const ioLine = this._drawIOLine(this.ioTypes[Cardinal.NORTH], Cardinal.NORTH, strokeWidth);
      group.add(ioLine);
    }

    // East IO
    if (ioType.NULL !== this.ioTypes[Cardinal.EAST]) {
      const ioLine = this._drawIOLine(this.ioTypes[Cardinal.EAST], Cardinal.EAST, strokeWidth);
      group.add(ioLine);
    }

    // South IO
    if (ioType.NULL !== this.ioTypes[Cardinal.SOUTH]) {
      const ioLine = this._drawIOLine(this.ioTypes[Cardinal.SOUTH], Cardinal.SOUTH, strokeWidth);
      group.add(ioLine);
    }

    // West IO
    if (ioType.NULL !== this.ioTypes[Cardinal.WEST]) {
      const ioLine = this._drawIOLine(this.ioTypes[Cardinal.WEST], Cardinal.WEST, strokeWidth);
      group.add(ioLine);
    }

    // Draw drag and drop shadow
    // See https://codepen.io/pierrebleroux/pen/gGpvxJ

    let targetX = this.x;
    let targetY = this.y;
    const dragRect = new Konva.Rect({
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

    group.on('dragstart', () => {
      dragRect.show();
      dragRect.moveToTop();
      group.moveToTop();

      // Keep previous position to pass it to moved event
      this.fromX = this.x;
      this.fromY = this.y;
    });

    group.on('dragend', () => {
      if (!this.rack) {
        return;
      }

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
    });

    group.on('dragmove', () => {
      if (!this.rack) {
        return;
      }

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

  tune(group:Pizzicato.Group) {
    // To override
  }

  untune(group:Pizzicato.Group) {
    // To override
  }
}
