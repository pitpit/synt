import Rack from './rack';
import PlugType from './plugType';
import Cardinal from './cardinal';
import Konva from 'konva';
import EventEmitter from 'eventemitter3';

export default class Mod {
  x:number = 0;
  y:number = 0;
  plugs:Array<Mod|null> = [];
  rack:Rack|null = null;
  events:EventEmitter = new EventEmitter();
  label:string = '';
  height:number = 1;
  width:number = 1;
  plugTypes:Array<Symbol> = [PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.NULL];

  /**
   * This method is called when drawing.
   * You'll have to override it to customize your Mod appearance.
   *
   * @override
   */
  draw(group:Konva.Group): void {
    //
  }

  /**
   * This method is called when a Mod is linked to your Mod.
   *
   * @override
   */
  wire(audioContext:AudioContext): void {
    //
  }

  /**
   * This method is called when a Mod is unlinked from your Mod.
   *
   * @override
   */
  unwire(audioContext:AudioContext): void {
    //
  }

  /**
   * What output does the current Mod returns on its plug {cardinal}.
   *
   * @override
   */
  getOutput(cardinal: number): any {
    return null;
  }

  /**
   * Configure the Mod
   */
  configure(
    label: string,
    width:number = 1,
    height:number = 1,
    plugTypes:Array<Symbol> = [PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.NULL],
  ): void {
    this.label = label;

    this.width = width;
    this.height = height;

    // TODO validate io
    this.plugTypes = plugTypes;
    this.plugTypes = [...this.plugTypes, ...Array(4-this.plugTypes.length).fill(PlugType.NULL)];
  }

  /**
   * Set parent rack of this Mod
   */
  setRack(rack: Rack) {
    this.rack = rack;

    return this;
  }

  /**
   * Set position of this Mod.
   *
   * @param x Absciss slot number
   * @param y Ordinate slot number
   */
  setPosition(x:number, y:number) {
    this.x = x;
    this.y = y;

    return this;
  }

  /**
   * Get the signal type of the plug.
   */
  getPlugType(cardinal: number): Symbol|null{
    if (this.plugTypes[cardinal]) {
      return this.plugTypes[cardinal];
    }

    return null;
  }

  /**
   * Does the Mod have an plug?
   */
  hasLinkablePlug(cardinal: number): boolean {
    return (this.plugTypes[cardinal] !== PlugType.NULL);
  }

  link(cardinal: number, to: Mod|null): Mod {
    if (!to || !this._isLinkable(cardinal, to)) {
      return this;
    }

    // TODO validate link (is the mod linked to another plug of this mod?)
    const oppositeCardinal = Cardinal.opposite(cardinal);

    const linked = this._getLinkedMod(cardinal);
    if (linked) {
      if (to === linked) {
        // Already linked to Mod {to}, abort
        return this;
      }

      // Unlink current linked Mod to free the plug
      linked.unlink(oppositeCardinal);
    }

    this.plugs[cardinal] = to;

    // TODO is it necessayre to trigger event ? (we've got a link chain)
    this.events.emit('linked', to, cardinal);

    // Link back target Mod
    to.link(oppositeCardinal, this);

    return this;
  }

  unlink(cardinal: number): Mod {
    const linked = this._getLinkedMod(cardinal);
    if (linked) {
      this.events.emit('unlinked', linked, cardinal);

      this.plugs[cardinal] = null;

      // Unlink back target Mod
      linked.unlink(Cardinal.opposite(cardinal));
    }

    return this;
  }

  /**
   * Get current mod linked to plug {cardinal}.
   *
   * @private
   */
  _getLinkedMod(cardinal: number): Mod|null {
    if (this.plugs[cardinal]) {
      return this.plugs[cardinal];
    }

    return null;
  }

  /**
   * Is the plug {cardinal} linked to another Mod?
   *
   * @private
   */
  _isLinked(cardinal: number): boolean {
    return (null !== this._getLinkedMod(cardinal));
  }

  /**
   * Can the current Mod be linked to the given Mod {to} through the {cardinal} plug?
   *
   * TODO check that the input accept the output type
   *
   * @private
   */
  _isLinkable(cardinal: number, to:Mod): boolean {
    const oppositeCardinal = Cardinal.opposite(cardinal);
    if (this.hasLinkablePlug(cardinal)
    && to.hasLinkablePlug(oppositeCardinal)
    && this.getPlugType(cardinal) !== to.getPlugType(oppositeCardinal)) {
      return true;
    }

    return false;
  }

  /**
   * Draw input/output type indicator
   *
   * @private
   */
  _drawPlug(
    io: Symbol,
    cardinal: number,
    slotWidth: number,
    slotHeight: number,
    strokeWidth: number,
  ): Konva.Line {
    const ioLineStrokeWidth = 5;
    const color = (PlugType.IN === io) ? 'green' : ((PlugType.OUT === io) ? 'red': 'gray');
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
   * Draw the Mod and attach events.
   *
   * TODO draw the dragRect in rack, and test isBusi o we don't need anymore to inject rack.
   */
  superDraw(
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

    this.plugTypes.forEach((plugType, cardinal) => {
      if (PlugType.NULL !== plugType) {
        const ioLine = this._drawPlug(
          plugType,
          cardinal,
          slotWidth,
          slotHeight,
          strokeWidth,
        );
        group.add(ioLine);
      }
    });

    // Store the current position
    // to move the Mod back to this slot if dropped
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
   * Get ouput coming from Mod linked to {cardinal}, if linked.
   */
  getInput(cardinal: number): any|null {
    if (PlugType.IN !== this.getPlugType(cardinal)) {
      return null;
    }

    const mod = this._getLinkedMod(cardinal);
    if (!mod) {
      return null;
    }

    return mod.getOutput(Cardinal.opposite(cardinal));
  }

  /**
   * Wire current Mod and trigger wiring on every Mods linked to each plug.
   */
  superWire(audioContext:AudioContext): void {
    this.wire(audioContext);

    this.plugTypes.forEach((plugType, cardinal) => {
      if (PlugType.OUT === plugType) {
        const mod = this._getLinkedMod(cardinal);
        if (mod) {
          mod.superWire(audioContext);
        }
      }
    });
  }

  superUnwire(audioContext:AudioContext): void {
    this.plugTypes.forEach((plugType, cardinal) => {
      if (PlugType.OUT === plugType) {
        const mod = this._getLinkedMod(cardinal);
        if (mod) {
          mod.superUnwire(audioContext);
        }
      }
    });
    this.unwire(audioContext);
  }
}
