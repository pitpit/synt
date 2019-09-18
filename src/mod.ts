import Rack from './rack';
import PlugType from './plug-type';
import PlugPosition from './plug-position';
import Konva from 'konva';
import EventEmitter from 'eventemitter3';
import { Signals, AudioSignal, BrokenAudioSignal, Signal } from './signal';
import { AudioContext } from 'standardized-audio-context';

export default class Mod {
  x:number = 0;
  y:number = 0;
  plugs:Array<Mod|null> = [];
  rack:Rack|null = null;
  audioContext:AudioContext|null = null;
  events:EventEmitter = new EventEmitter();
  label:string = '';
  height:number = 1;
  width:number = 1;
  plugTypes:Array<Symbol> = [PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.NULL];
  lastPropagationId: string|null = null;
  outputSignals: Signals|null = null;

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

  setAudioContext(audioContext: AudioContext) {
    this.audioContext = audioContext;

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

  process(inputSignals: Signals): Signals {
    return [null, null, null, null];
  }

  _generateProcessId(): string {
    return Math.random().toString(36).substr(2, 9);;
  }

  /**
   * Link current Mod to every passed targets Mods (north, east, south, west)
   */
  linkAll(targets: Array<Mod|null>) {
    targets.forEach((target, plugPosition) => {
      if (target && this._isLinkable(plugPosition, target)) {
        this.link(plugPosition, target);
      }
    });

    this.push(this._generateProcessId());
  }

  /**
   * Unlink current Mod from every linked Mods
   */
  unlinkAll() {
    this.snatch(this._generateProcessId());

    this.plugTypes.forEach((plugType: PlugType, plugPosition: number) => {
      this.unlink(plugPosition);
    });
  }

  link(plugPosition: number, target: Mod): Mod {

    // TODO validate link (is the mod linked to another plug of this mod?)
    const oppositePlugPosition = PlugPosition.opposite(plugPosition);

    const linked = this._getLinkedMod(plugPosition);
    if (linked) {
      if (target === linked) {
        // Already linked to Mod {target}, abort
        return this;
      }

      // Unlink current linked Mod to free the plug
      linked.unlink(oppositePlugPosition);
    }

    this.plugs[plugPosition] = target;

    // Reserse link
    target.link(oppositePlugPosition, this);

    return this;
  }

  unlink(plugPosition: number): Mod {
    const linked = this._getLinkedMod(plugPosition);
    if (linked) {
      this.plugs[plugPosition] = null;

      //TODO do we need to keep bilateral link ?
      // Reverse unlink target Mod
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
   * Can the current Mod be linked to the given Mod {to} through the {plugPosition} plug?
   *
   * TODO check that the input accept the output type
   *
   * @private
   */
  _isLinkable(plugPosition: number, to:Mod): boolean {
    const oppositePlugPosition = PlugPosition.opposite(plugPosition);
    if (
      (
        PlugType.OUT === this.getPlugType(plugPosition)
        && PlugType.IN === to.getPlugType(oppositePlugPosition)
      ) || (
        PlugType.IN === this.getPlugType(plugPosition)
        && PlugType.OUT === to.getPlugType(oppositePlugPosition)
      ) || (
        PlugType.CTRLIN === this.getPlugType(plugPosition)
        && PlugType.CTRLOUT === to.getPlugType(oppositePlugPosition)
      ) || (
        PlugType.CTRLOUT === this.getPlugType(plugPosition)
        && PlugType.CTRLIN === to.getPlugType(oppositePlugPosition)
      )
    ) {
      return true;
    }

    return false;
  }

  _drawCtrlPlug(
    group: Konva.Group,
    plugType: PlugType,
    plugPosition: number,
    slotWidth: number,
    slotHeight: number,
    strokeWidth: number,
    plugLineStrokeWidth: number,
  ): void {
    let color1: string;
    let color2: string;
    if (PlugType.CTRLIN === plugType) {
      color1 = 'blue';
      color2 = 'orange';
    } else if (PlugType.CTRLOUT === plugType) {
      color1 = 'orange';
      color2 = 'blue';
    } else {
      throw new Error('Invalid plug type');
    }

    let bottomPoints: Array<number> = [0, 0, 0, 0];
    let topPoints: Array<number> = [0, 0, 0, 0];
    if (PlugPosition.NORTH === plugPosition) {
      const y = strokeWidth + plugLineStrokeWidth/2;
      bottomPoints = [strokeWidth, y, slotWidth / 2, y];
      topPoints = [slotWidth / 2, y, slotWidth - strokeWidth, y];
    } else if (PlugPosition.EAST === plugPosition) {
      const x = this.width * slotWidth - (strokeWidth + plugLineStrokeWidth/2);
      bottomPoints = [x, strokeWidth, x, this.height * slotHeight / 2];
      topPoints = [x, this.height * slotHeight / 2, x, this.height * slotHeight - strokeWidth];
    } else if (PlugPosition.SOUTH === plugPosition) {  // South
      const y = this.width * slotWidth - (strokeWidth + plugLineStrokeWidth/2);
      bottomPoints = [strokeWidth, y, slotWidth / 2, y];
      topPoints = [strokeWidth, y, slotWidth - strokeWidth,y];
    } else if (PlugPosition.WEST === plugPosition) { // West
      const x = strokeWidth+ plugLineStrokeWidth/2;
      bottomPoints = [x, strokeWidth, x, this.height * slotHeight / 2];
      topPoints = [x, this.height * slotHeight / 2, x, this.height * slotHeight - strokeWidth];
    } else {
      throw new Error('Invalid plugPosition value');
    }
    const plugLine1 = new Konva.Line({
      points: bottomPoints,
      stroke: color1,
      strokeWidth: plugLineStrokeWidth,
      lineCap: 'sqare',
    });
    const plugLine2 = new Konva.Line({
      points: topPoints,
      stroke: color2,
      strokeWidth: plugLineStrokeWidth,
      lineCap: 'sqare',
    });
    group.add(plugLine1);
    group.add(plugLine2);
  }

  /**
   * Draw input/output type indicator
   *
   * @private
   */
  _drawIoPlug(
    group: Konva.Group,
    plugType: PlugType,
    plugPosition: number,
    slotWidth: number,
    slotHeight: number,
    strokeWidth: number,
    plugLineStrokeWidth: number,
  ): void {
    let color: string;
    if (PlugType.IN === plugType) {
      color = 'green';
    } else if (PlugType.OUT === plugType) {
      color = 'red';
    } else {
      throw new Error('Invalid plug type');
    }
    let points: Array<number> = [0, 0, 0, 0];

    if (PlugPosition.NORTH === plugPosition) {
      const y = strokeWidth + plugLineStrokeWidth/2;
      points = [strokeWidth, y, slotWidth - strokeWidth, y];
    } else if (PlugPosition.EAST === plugPosition) {
      const y = this.width * slotWidth - (strokeWidth + plugLineStrokeWidth/2);
      points = [y, strokeWidth, y, this.height * slotHeight - strokeWidth];
    } else if (PlugPosition.SOUTH === plugPosition) {  // South
      const y = this.width * slotWidth - (strokeWidth + plugLineStrokeWidth/2);
      points = [strokeWidth, y, slotWidth - strokeWidth, y];
    } else if (PlugPosition.WEST === plugPosition) { // West
      const x = strokeWidth+ plugLineStrokeWidth/2;
      points = [x, strokeWidth, x, this.height * slotHeight - strokeWidth];
    } else {
      throw new Error('Invalid plugPosition value');
    }

    const plugLine = new Konva.Line({
      points,
      stroke: color,
      strokeWidth: plugLineStrokeWidth,
      lineCap: 'sqare',
    });

    group.add(plugLine);
  }

  /**
   * Draw the Mod and attach events.
   *
   * TODO draw the dragRect in rack, and test isBusi o we don't need anymore to inject rack.
   */
  init(
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

    const plugLineStrokeWidth = 5;
    this.plugTypes.forEach((plugType: PlugType, plugPosition: number) => {
      if (
        PlugType.IN === plugType
        || PlugType.OUT === plugType
      ) {
        const plugLine = this._drawIoPlug(
          group,
          plugType,
          plugPosition,
          slotWidth,
          slotHeight,
          strokeWidth,
          plugLineStrokeWidth,
        );
      } else if (
        PlugType.CTRLIN === plugType
        || PlugType.CTRLOUT === plugType
      ) {
        const plugLine = this._drawCtrlPlug(
          group,
          plugType,
          plugPosition,
          slotWidth,
          slotHeight,
          strokeWidth,
          plugLineStrokeWidth,
        );
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
   * Get signals from input plugs.
   */
  _getInputSignals(): Signals {
    const inputSignals: Signals = [null, null, null, null];

    this.eachLinked((mod: Mod, plugType: PlugType, plugPosition: number) => {
      if (PlugType.IN === plugType || PlugType.CTRLOUT === plugType) {
        const oppositePlugPosition = PlugPosition.opposite(plugPosition);
        inputSignals[plugPosition] = mod.getOutputSignal(oppositePlugPosition);
      }
    });

    return inputSignals;
  }
  /**
   * Get signals from input plugs, process it via the current Mod and propagate output signals
   * to every linked Mods.
   */
  push(id: string): void {
    if (id === this.lastPropagationId) {
      return;
    }
    this.lastPropagationId = id;

    const inputSignals: Signals = this._getInputSignals();
    this.outputSignals = this.process(inputSignals);

    this.eachLinked((mod: Mod, plugType: PlugType, plugPosition: number) => {
      if (PlugType.OUT === plugType) {
      // if (PlugType.OUT === plugType || PlugType.CTRLIN === plugType) {
        mod.push(id);
      }
    });
  }

  /**
   * When the Mod is snatched: propagate BrokenSignal output to every linked Mod.
   */
  snatch(id: string) {

    this.events.emit('snatched');

    const brokenOutputSignals: Signals = [null, null, null, null];
    this.plugTypes.forEach((plugtype, plugPosition) => {

      const outputSignal = this.outputSignals ? this.outputSignals[plugPosition]: null;
      if (outputSignal instanceof AudioSignal) {
        brokenOutputSignals[plugPosition] = new BrokenAudioSignal(outputSignal);
      }
    });
    this.outputSignals = brokenOutputSignals;

    this.eachLinked((mod: Mod, plugType: PlugType, plugPosition: number) => {
      if (PlugType.OUT === plugType) {
        mod.push(id);
      }
    });
  }

  /**
   * Iterate over linked Mods and plugs.
   */
  eachLinked(callback: Function) {
    this.plugTypes.forEach((plugType: PlugType, plugPosition: number) => {
      const mod = this._getLinkedMod(plugPosition);
      if (mod) {
        callback(mod, plugType, plugPosition);
      }
    });
  }

  /**
   * Get output signal emit on plug {plugPosition}
   */
  getOutputSignal(plugPosition: number): Signal|null {
    if (!this.outputSignals) {
      // If Mod has not be linked before, push() has not been call
      // So this.outputSignals is null, we need to compute it
      const inputSignals: Signals = this._getInputSignals();
      this.outputSignals = this.process(inputSignals);
    }

    return this.outputSignals[plugPosition];
  }
}
