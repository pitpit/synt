import Rack from './rack';
import IoType from './ioType';
import Cardinal from './cardinal';
import Konva from 'konva';
import EventEmitter from 'eventemitter3';

export default class Mod {
  x:number = 0;
  y:number = 0;
  height:number;
  width:number;
  ioTypes:Array<Symbol>;
  io:Array<Mod|null> = [];
  rack:Rack|null = null;
  events:EventEmitter;
  fromX:number = 0;
  fromY:number = 0;
  label:string = '';

  /**
   *  TODO develop a super method that is not overridable by inherited Mod
   */
  constructor(
    width:number = 1,
    height:number = 1,
    ioTypes:Array<Symbol> = [IoType.NULL, IoType.NULL, IoType.NULL, IoType.NULL],
  ) {
    this.width = width;
    this.height = height;

    // TODO validate io
    this.ioTypes = ioTypes;
    this.ioTypes = [...this.ioTypes, ...Array(4-this.ioTypes.length).fill(IoType.NULL)];
    this.events = new EventEmitter();
  }

  /**
   * Set parent rack and the postion of this Mod on it
   */
  setRack(rack: Rack, x:number, y:number) {
    this.rack = rack;
    this.x = x;
    this.y = y;

    return this;
  }

  /**
   * Get the type of the Io plug
   */
  getIoType(cardinal: number): Symbol|null{
    if (this.ioTypes[cardinal]) {
      return this.ioTypes[cardinal];
    }

    return null;
  }

  /**
   * Does the Mod have an Io plug
   */
  hasLinkableIo(cardinal: number): boolean {
    return (this.ioTypes[cardinal] !== IoType.NULL);
  }

  link(cardinal: number, to: Mod|null): Mod {
    if (!to || !this._isLinkable(cardinal, to)) {
      return this;
    }

    // TODO validate link (is the mod linked to another plug of this mod)
    const oppositeCardinal = Cardinal.opposite(cardinal);

    const linked = this._getCurrentLinked(cardinal);
    if (linked) {
      if (to === linked) {
        // Already linked to Mod {to}, abort
        return this;
      }

      // Unlink current linked Mod to free the Io plug
      linked.unlink(oppositeCardinal);
    }

    this.io[cardinal] = to;

    // TODO is it necessayre to trigger event ? (we've got a link chain)
    this.events.emit('linked', to, cardinal);

    // Link back target Mod
    to.link(oppositeCardinal, this);

    return this;
  }

  unlink(cardinal: number): Mod {
    const linked = this._getCurrentLinked(cardinal);
    if (linked) {
      this.events.emit('unlinked', linked, cardinal);

      this.io[cardinal] = null;

      // Unlink back target Mod
      linked.unlink(Cardinal.opposite(cardinal));
    }

    return this;
  }

  /**
   * Get current mod linked to Io plug {cardinal}.
   * @private
   */
  _getCurrentLinked(cardinal: number): Mod|null {
    if (this.io[cardinal]) {
      return this.io[cardinal];
    }

    return null;
  }

  _isLinked(cardinal: number): boolean {
    return (null !== this._getCurrentLinked(cardinal));
  }

  /**
   * Can the current Mod be linked to the given Mod {to} through the {cardinal} Io plug
   * TODO check that the input accept the output type
   * @private
   */
  _isLinkable(cardinal: number, to:Mod): boolean {
    const oppositeCardinal = Cardinal.opposite(cardinal);
    if (this.hasLinkableIo(cardinal)
    && to.hasLinkableIo(oppositeCardinal)
    && this.getIoType(cardinal) !== to.getIoType(oppositeCardinal)) {
      return true;
    }

    return false;
  }

  /**
   * Draw input/output type indicator
   * @private
   */
  _drawIOLine(io: Symbol, cardinal: number, strokeWidth: number): Konva.Line {
    if (!this.rack) {
      throw new Error('Mod is not attached to a rack');
    }

    const ioLineStrokeWidth = 5;
    const color = (IoType.IN === io) ? 'green' : ((IoType.OUT === io) ? 'red': 'gray');
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

  /**
   * Draw the Mod.
   * Override this method to customize your Mod appearance.
   *
   * TODO move this.x and this.y in rack, draw the dragRect in rack
   * So we don't need anymore to inject rack
   *
   * TODO develop a super method that is not overridable by inherited Mod
   */
  draw(group:Konva.Group): void {
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
    if (IoType.NULL !== this.ioTypes[Cardinal.NORTH]) {
      const ioLine = this._drawIOLine(this.ioTypes[Cardinal.NORTH], Cardinal.NORTH, strokeWidth);
      group.add(ioLine);
    }

    // East IO
    if (IoType.NULL !== this.ioTypes[Cardinal.EAST]) {
      const ioLine = this._drawIOLine(this.ioTypes[Cardinal.EAST], Cardinal.EAST, strokeWidth);
      group.add(ioLine);
    }

    // South IO
    if (IoType.NULL !== this.ioTypes[Cardinal.SOUTH]) {
      const ioLine = this._drawIOLine(this.ioTypes[Cardinal.SOUTH], Cardinal.SOUTH, strokeWidth);
      group.add(ioLine);
    }

    // West IO
    if (IoType.NULL !== this.ioTypes[Cardinal.WEST]) {
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

    const layer = group.getLayer();
    if (!layer) {
      throw new Error('No Layer attached to this Konva Group');
    }
    layer.add(dragRect);

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

      this.events.emit('dragstart');

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

      // Prepare dragRect for next move
      targetX = this.x;
      targetY = this.y;
      dragRect.hide();
      dragRect.position({
        x: this.rack.padding + targetX * this.rack.slotWidth,
        y: this.rack.padding + targetY * this.rack.slotHeight,
      });

      const stage = group.getStage();
      if (!stage) {
        throw new Error('No Stage attached to this Konva Group');
      }
      stage.batchDraw();

      this.events.emit('dragend');
    });

    group.on('dragmove', () => {
      if (!this.rack) {
        return;
      }

      // Compute new position
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

        const stage = group.getStage();
        if (!stage) {
          throw new Error('No Stage attached to this Konva Group');
        }
        stage.batchDraw();
      }
    });
  }
}
