import Rack from './rack';
import IoType from './ioType';
import Cardinal from './cardinal';
import Konva from 'konva';
import EventEmitter from 'eventemitter3';

export default class Mod {
  x:number = 0;
  y:number = 0;
  io:Array<Mod|null> = [];
  rack:Rack|null = null;
  events:EventEmitter = new EventEmitter();
  label:string = '';
  height:number = 1;
  width:number = 1;
  ioTypes:Array<Symbol> = [IoType.NULL, IoType.NULL, IoType.NULL, IoType.NULL];

  constructor() {
    this.setup();
  }

  /**
   * @override
   */
  setup(): void {}

  /**
   * Quickly configure the Mod
   */
  configure(
    label: string,
    width:number = 1,
    height:number = 1,
    ioTypes:Array<Symbol> = [IoType.NULL, IoType.NULL, IoType.NULL, IoType.NULL],
  ): void {
    this.label = label;

    this.width = width;
    this.height = height;

    // TODO validate io
    this.ioTypes = ioTypes;
    this.ioTypes = [...this.ioTypes, ...Array(4-this.ioTypes.length).fill(IoType.NULL)];
  }

  /**
   * Set parent rack of this Mod
   */
  setRack(rack: Rack) {
    this.rack = rack;

    return this;
  }

  setPosition(x:number, y:number) {
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
  _drawIo(
    io: Symbol,
    cardinal: number,
    slotWidth: number,
    slotHeight: number,
    strokeWidth: number,
  ): Konva.Line {

    const ioLineStrokeWidth = 5;
    const color = (IoType.IN === io) ? 'green' : ((IoType.OUT === io) ? 'red': 'gray');
    let points: Array<number> = [0, 0, 0, 0];

    if (Cardinal.NORTH === cardinal) {
      points = [
        strokeWidth,
        strokeWidth + ioLineStrokeWidth/2,
        slotWidth - strokeWidth,
        strokeWidth+ ioLineStrokeWidth/2,
      ];
    } else if (Cardinal.EAST === cardinal) {
      points = [
        this.width * slotWidth - (strokeWidth + ioLineStrokeWidth/2),
        strokeWidth,
        this.width * slotWidth - (strokeWidth + ioLineStrokeWidth/2),
        this.height * slotHeight - strokeWidth,
      ];
    } else if (Cardinal.SOUTH === cardinal) {  // South
      points = [
        strokeWidth,
        this.width * slotWidth - (strokeWidth + ioLineStrokeWidth/2),
        slotWidth - strokeWidth,
        this.width * slotWidth - (strokeWidth + ioLineStrokeWidth/2),
      ];
    } else if (Cardinal.WEST === cardinal) { // West
      points = [
        strokeWidth+ ioLineStrokeWidth/2,
        strokeWidth,
        strokeWidth+ ioLineStrokeWidth/2,
        this.height * slotHeight - strokeWidth,
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
  drawBase(
    slotWidth: number,
    slotHeight: number,
    padding: number,
    group:Konva.Group,
  ): void {
    const strokeWidth = 5;

    group.position({
      x: this.x * slotWidth + padding,
      y: this.y * slotHeight + padding,
    });

    group.size({
      width: this.width * slotWidth,
      height: this.height * slotHeight,
    });

    const rect = new Konva.Rect({
      x: 0 + strokeWidth/2,
      y: 0 + strokeWidth/2,
      width:  this.width * slotWidth - strokeWidth,
      height: this.height * slotHeight - strokeWidth,
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
      const ioLine = this._drawIo(
        this.ioTypes[Cardinal.NORTH],
        Cardinal.NORTH,
        slotWidth,
        slotHeight,
        strokeWidth,
      );
      group.add(ioLine);
    }

    // East IO
    if (IoType.NULL !== this.ioTypes[Cardinal.EAST]) {
      const ioLine = this._drawIo(
        this.ioTypes[Cardinal.EAST],
        Cardinal.EAST,
        slotWidth,
        slotHeight,
        strokeWidth,
      );
      group.add(ioLine);
    }

    // South IO
    if (IoType.NULL !== this.ioTypes[Cardinal.SOUTH]) {
      const ioLine = this._drawIo(
        this.ioTypes[Cardinal.SOUTH],
        Cardinal.SOUTH,
        slotWidth,
        slotHeight,
        strokeWidth,
      );
      group.add(ioLine);
    }

    // West IO
    if (IoType.NULL !== this.ioTypes[Cardinal.WEST]) {
      const ioLine = this._drawIo(
        this.ioTypes[Cardinal.WEST],
        Cardinal.WEST,
        slotWidth,
        slotHeight,
        strokeWidth,
      );
      group.add(ioLine);
    }

    // Store the current position
    // to move the Mod  back to this slot if dropped
    let targetX = this.x;
    let targetY = this.y;

    // Draw drag and drop shadow
    // See https://codepen.io/pierrebleroux/pen/gGpvxJ
    const shadow = new Konva.Rect({
      x: targetX * slotWidth + padding + strokeWidth/2,
      y: targetY * slotHeight + padding + strokeWidth/2,
      width:  this.width * slotWidth,
      height: this.height * slotHeight,
      fill: '#cccccc',
      opacity: 0.6,
      stroke: '#dddddd',
      strokeWidth: 1,
    });
    shadow.hide();

    const layer = group.getLayer();
    if (!layer) {
      throw new Error('No Layer attached to this Konva Group');
    }
    layer.add(shadow);

    group.on('mouseover', () => {
      document.body.style.cursor = 'pointer';
    });
    group.on('mouseout', () => {
      document.body.style.cursor = 'default';
    });

    group.on('dragstart', () => {
      shadow.show();
      shadow.moveToTop();
      group.moveToTop();

      this.events.emit('dragstart');
    });

    group.on('dragend', () => {
      if (!this.rack) {
        return;
      }

      // Compute new Mod position
      let x = Math.round(group.x() / slotWidth);
      let y = Math.round(group.y() / slotHeight);
      x = x > 0 ? x : 0;
      y = y > 0 ? y : 0;

      if (this.rack.isBusy(x, y, this)) {
        // Move the Mod back to its prior slot
        this.x = targetX;
        this.y = targetY;
      } else {
        this.x = x;
        this.y = y;
      }
      group.position({
        x: padding + this.x * slotWidth,
        y: padding + this.y * slotHeight,
      });

      // Prepare dragRect for next move
      // targetX = this.x;
      // targetY = this.y;
      // shadow.hide();
      // shadow.position({
      //   x: padding + targetX * slotWidth,
      //   y: padding + targetY * slotHeight,
      // });

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
      let x = Math.round(group.x() / slotWidth);
      let y = Math.round(group.y() / slotHeight);
      x = x > 0 ? x : 0;
      y = y > 0 ? y : 0;

      if (!this.rack.isBusy(x, y, this)) {
        // Move the shadow to the current slot
        shadow.position({
          x: padding + x * slotWidth,
          y: padding + y * slotHeight,
        });

        // Store the position, to move the Mod to this position
        // if next slot is busy
        targetX = x;
        targetY = y;

        const stage = group.getStage();
        if (!stage) {
          throw new Error('No Stage attached to this Konva Group');
        }
        stage.batchDraw();

        this.events.emit('dragmove');
      }
    });

    this.draw(group);
  }

  /**
   * @override
   */
  draw(group:Konva.Group): void {}
}
