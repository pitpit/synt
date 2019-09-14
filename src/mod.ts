import Rack from './rack';
import PlugType from './plug-type';
import PlugPosition from './plug-position';
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
   * What output does the current Mod returns on its plug {plugPosition}.
   *
   * @override
   */
  getOutput(plugPosition: number): any {
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
  getPlugType(plugPosition: number): Symbol|null{
    if (this.plugTypes[plugPosition]) {
      return this.plugTypes[plugPosition];
    }

    return null;
  }

  link(plugPosition: number, to: Mod|null): Mod {
    if (!to || !this._isLinkable(plugPosition, to)) {
      return this;
    }
    // TODO validate link (is the mod linked to another plug of this mod?)
    const oppositePlugPosition = PlugPosition.opposite(plugPosition);

    const linked = this._getLinkedMod(plugPosition);
    if (linked) {
      if (to === linked) {
        // Already linked to Mod {to}, abort
        return this;
      }

      // Unlink current linked Mod to free the plug
      linked.unlink(oppositePlugPosition);
    }

    this.plugs[plugPosition] = to;

    // TODO is it necessayre to trigger event ? (we've got a link chain)
    // this.events.emit('linked', to, plugPosition);

    // Link back target Mod
    to.link(oppositePlugPosition, this);

    return this;
  }

  unlink(plugPosition: number): Mod {
    const linked = this._getLinkedMod(plugPosition);
    if (linked) {
      // this.events.emit('unlinked', linked, plugPosition);

      this.plugs[plugPosition] = null;

      // Unlink back target Mod
      linked.unlink(PlugPosition.opposite(plugPosition));
    }

    return this;
  }

  /**
   * Get current mod linked to plug {plugPosition}.
   *
   * @private
   */
  _getLinkedMod(plugPosition: number): Mod|null {
    if (this.plugs[plugPosition]) {
      return this.plugs[plugPosition];
    }

    return null;
  }

  /**
   * Is the plug {plugPosition} linked to another Mod?
   *
   * @private
   */
  _isLinked(plugPosition: number): boolean {
    return (null !== this._getLinkedMod(plugPosition));
  }

  /**
   * Can the current Mod be linked to the given Mod {to} through the {plugPosition} plug?
   *
   * TODO check that the input accept the output type
   *
   * @private
   */
  _isLinkable(plugPosition: number, to:Mod): boolean {
    const oppositePlugPosition = PlugPosition.opposite(plugPosition);
    if (
      (PlugType.OUT === this.getPlugType(plugPosition) && PlugType.IN === to.getPlugType(oppositePlugPosition))
      || (PlugType.IN === this.getPlugType(plugPosition) && PlugType.OUT === to.getPlugType(oppositePlugPosition))
      || (PlugType.CTRL === this.getPlugType(plugPosition) && PlugType.CTRL === to.getPlugType(oppositePlugPosition))
    ) {
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
    plugType: Symbol,
    plugPosition: number,
    slotWidth: number,
    slotHeight: number,
    strokeWidth: number,
  ): Konva.Line {
    const plugLineStrokeWidth = 5;
    let color: string;
    if (PlugType.IN === plugType) {
      color = 'green';
    } else if (PlugType.OUT === plugType) {
      color = 'red';
    } else if (PlugType.CTRL === plugType) {
      color = 'blue';
    } else {
      color = 'gray';
    }
    let points: Array<number> = [0, 0, 0, 0];

    if (PlugPosition.NORTH === plugPosition) {
      points = [
        strokeWidth,
        strokeWidth + plugLineStrokeWidth/2,
        slotWidth - strokeWidth,
        strokeWidth+ plugLineStrokeWidth/2,
      ];
    } else if (PlugPosition.EAST === plugPosition) {
      points = [
        this.width * slotWidth - (strokeWidth + plugLineStrokeWidth/2),
        strokeWidth,
        this.width * slotWidth - (strokeWidth + plugLineStrokeWidth/2),
        this.height * slotHeight - strokeWidth,
      ];
    } else if (PlugPosition.SOUTH === plugPosition) {  // South
      points = [
        strokeWidth,
        this.width * slotWidth - (strokeWidth + plugLineStrokeWidth/2),
        slotWidth - strokeWidth,
        this.width * slotWidth - (strokeWidth + plugLineStrokeWidth/2),
      ];
    } else if (PlugPosition.WEST === plugPosition) { // West
      points = [
        strokeWidth+ plugLineStrokeWidth/2,
        strokeWidth,
        strokeWidth+ plugLineStrokeWidth/2,
        this.height * slotHeight - strokeWidth,
      ];
    } else {
      throw new Error('Invalid plugPosition value');
    }

    const plugLine = new Konva.Line({
      points,
      stroke: color,
      strokeWidth: plugLineStrokeWidth,
      lineCap: 'sqare',
    });

    return plugLine;
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

    this.plugTypes.forEach((plugType, plugPosition) => {
      if (PlugType.NULL !== plugType) {
        const plugLine = this._drawPlug(
          plugType,
          plugPosition,
          slotWidth,
          slotHeight,
          strokeWidth,
        );
        group.add(plugLine);
      }
    });

    // Draw drag and drop shadow
    // See https://codepen.io/pierrebleroux/pen/gGpvxJ
    const shadow = new Konva.Rect({
      x: this.x * slotWidth + padding + strokeWidth/2,
      y: this.y * slotHeight + padding + strokeWidth/2,
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

    // Store the current position
    // to move the Mod back to this slot if dropped
    let targetX = this.x;
    let targetY = this.y;

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

    group.on('dblclick', () => {
      this.events.emit('dblclick');
    });

    this.draw(group);
  }

  /**
   * Get ouput coming from Mod linked to {plugPosition}, if linked.
   */
  getInput(plugPosition: number): any|null {
    if (PlugType.IN !== this.getPlugType(plugPosition)
      && PlugType.CTRL !== this.getPlugType(plugPosition)) {
      return null;
    }
    const mod = this._getLinkedMod(plugPosition);
    if (!mod) {
      return null;
    }

    return mod.getOutput(PlugPosition.opposite(plugPosition));
  }

  /**
   * Wire current Mod and trigger wiring on every Mods linked to each plug.
   */
  superWire(audioContext:AudioContext): void {
    this.wire(audioContext);

    this.plugTypes.forEach((plugType, plugPosition) => {
      if (PlugType.OUT === plugType) {
        const mod = this._getLinkedMod(plugPosition);
        if (mod) {
          mod.superWire(audioContext);
        }
      }
    });
  }

  superUnwire(audioContext:AudioContext): void {
    this.plugTypes.forEach((plugType, plugPosition) => {
      if (PlugType.OUT === plugType) {
        const mod = this._getLinkedMod(plugPosition);
        if (mod) {
          mod.superUnwire(audioContext);
        }
      }
    });
    this.unwire(audioContext);
  }
}
