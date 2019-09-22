import Rack from './Rack';
import Plugs from './plugs';
import Plug from './plug';
import PlugType from './PlugType';
import PlugPosition from './PlugPosition';
import Konva from 'konva';
import EventEmitter from 'eventemitter3';
import { Signals, AudioSignal, BrokenAudioSignal, Signal } from './Signal';

abstract class BaseMod {
  /**
   *  Absciss slot number
   */
  x:number = 0;

  /**
   * Ordinate slot number
   */
  y:number = 0;
  readonly plugs: Plugs = new Plugs();
  rack:Rack|null = null;
  label:string = '';
  height:number = 1;
  width:number = 1;
  readonly events:EventEmitter = new EventEmitter();

  private lastPropagationId: string|null = null;
  private outputSignals: Signals = [null, null, null, null];
  private inputSignals: Signals = [null, null, null, null];

  /**
   * This method is called when drawing.
   * You'll have to override it to customize your Mod appearance.
   *
   * @override
   */
  abstract draw(group:Konva.Group): void;

  /**
   *
   * @override
   */
  abstract getOutputs(diffInputSignals: Signals): Signals;

  /**
   * Configure the Mod
   * @helper
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

    this.plugs.setTypes(plugTypes);
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

    this.plugs.forEach((plug: Plug, plugPosition: number) => {
      plug.draw(
        group,
        plugPosition,
        this.width,
        this.height,
        slotWidth,
        slotHeight,
        strokeWidth,
      );
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
   * Is the mod an entry?
   * A mod is an entry if it has at least one linked OUT plug and no IN plug (linked or not)
   */
  isEntry(): boolean {
    let haveIn = false;
    let haveLinkedOut = false;

    const breakMe: object = {};
    try {
      this.plugs.forEach((plug: Plug, plugPosition: number) => {
        if (plug.type === PlugType.IN) {
          haveIn = true;
          throw breakMe;
        }
        if (plug.isOutput()) {
          haveLinkedOut = true;
        }
      });
    } catch (e) {
      if (e !== breakMe) throw e;
    }

    return (haveLinkedOut && !haveIn);
  }

  /**
   * Ride up link chain to find entry Mod
   */
  findEntries(): Array<Mod> {
    if (this.isEntry()) {
      return [this];
    }

    let entries: Array<Mod> = [];
    this.plugs.forEach((plug: Plug, plugPosition: number) => {
      if (plug.mod && plug.isInput()) {
        const likedModEntries = plug.mod.findEntries();
        entries = [...entries, ...likedModEntries];
      }
    });
    return entries;
  }

  /**
   * TODO move it to Plugs or Plug
   */
  link(plugPosition: number, target: Mod): void {
    // TODO validate link (is the mod linked to another plug of this mod?)
    const oppositePlugPosition = PlugPosition.opposite(plugPosition);

    const plug = this.plugs.getPlug(plugPosition);
    if (plug.mod) {
      if (target === plug.mod) {
        // Already linked to Mod {target}, abort
        return;
      }

      // Unlink current linked Mod to free the plug
      plug.mod.unlink(oppositePlugPosition);
    }

    plug.mod = target;

    // Reserse link
    target.link(oppositePlugPosition, this);

    return;
  }

    /**
   * TODO move it to Plugs or Plug
   */
  unlink(plugPosition: number): void {
    const plug = this.plugs.getPlug(plugPosition);
    const linked = plug.mod;
    if (plug.mod) {
      const mod = plug.mod;
      plug.mod = null;

      // Reverse unlink target Mod
      mod.unlink(PlugPosition.opposite(plugPosition));
    }

    return;
  }

  /**
   * Compute state changes on plugs and trigger Mod onChange
   */
  private processInputs(inputSignals: Signals): Signals {
    let outputSignals: Signals = [null, null, null, null];

    outputSignals = this.getOutputs(inputSignals);

    return outputSignals;
  }

  /**
   * Start the signal chain.
   * It computes output signals from empty signals then
   * it propagate them to every output plugs.
   */
  start() {
    this.inputSignals = [null, null, null, null];
    const outputSignals: Signals = this.processInputs(this.inputSignals);

    this.pushOutputs(outputSignals);
  }

  /**
   * Plug current Mod to every passed targets Mods (north, east, south, west).
   */
  plug(targets: Array<Mod|null>): void {
    // this.plugs.resetUntriggeredLinkedInput();
    targets.forEach((target, plugPosition) => {
      const oppositePlugPosition = PlugPosition.opposite(plugPosition);
      if (target) {
        const fromPlug = this.plugs.getPlug(plugPosition);
        const toPlug = target.plugs.getPlug(oppositePlugPosition);
        if (fromPlug.isLinkable(toPlug)) {
          this.link(plugPosition, target);
        }
      }
    });
  }

  /**
   * Snatch current Mod from linked Mods.
   * It propagates a BrokenAudioSignal through every output plugs
   * then it unlinks each plug.
   */
  snatch(): void {
    this.events.emit('snatched');

    // this.plugs.resetUntriggeredLinkedInput();

    const brokenOutputSignals: Signals = [null, null, null, null];
    this.plugs.forEach((plug: Plug, plugPosition: number) => {
      const outputSignal = this.outputSignals[plugPosition];
      if (outputSignal instanceof AudioSignal) {
        brokenOutputSignals[plugPosition] = new BrokenAudioSignal(outputSignal.node);
      }
    });

    // Reset stored outputs
    this.outputSignals = [null, null, null, null];

    this.pushOutputs(brokenOutputSignals);

    this.plugs.forEach((plug: Plug, plugPosition: number) => {
      this.unlink(plugPosition);
    });
  }

  private generateProcessId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Push an input signal to a plug.
   * TODO move it to Plugs ?
   */
  pushInput(plugPosition: number, signal: Signal|null, id: string|null = null): void {
    if (!id) {
      id = this.generateProcessId();
    }

    if (id === this.lastPropagationId) {
      return;
    }
    this.lastPropagationId = id;

    this.inputSignals[plugPosition] = signal;

    // if (this.plugs.hasUntriggeredLinkedInput()) {
    //   // Some linked input plug has not been triggered yet, waiting for other signals
    //   // to be propagated from entries
    //   return;
    // }

    const outputSignals: Signals = this.processInputs(this.inputSignals);

    this.pushOutputs(outputSignals, id);
  }

  /**
   * Push all output signals to the outpout plugs.
   * TODO move it to Plugs ?
   */
  private pushOutputs(outputSignals:Signals, id: string|null = null): void {
    this.plugs.forEach((plug: Plug, plugPosition: number) => {
      const outputSignal = outputSignals[plugPosition];
      if (outputSignal) {
        this.pushOutput(plugPosition, outputSignal);
      }
    });
  }

  /**
   * Push an output signal to a plug.
   * @helper
   */
  pushOutput(plugPosition: number, outputSignal: Signal|null): void {

    // if outputSignal did not change do not propagate it
    if (outputSignal === this.outputSignals[plugPosition]) {
      console.log('no diff with previous output signal');
      return;
    }

    // TODO store outputSignal for later diff
    this.outputSignals[plugPosition] = outputSignal;

    const plug = this.plugs.getPlug(plugPosition);
    if (plug.mod && plug.isOutput()) {
      const oppositePlugPosition = PlugPosition.opposite(plugPosition);
      plug.mod.pushInput(oppositePlugPosition, outputSignal);
    }
  }
}

export default class Mod extends BaseMod
{
  draw(group:Konva.Group) {
    //
  }

  getOutputs(diffInputSignals: Signals): Signals {
    return [null, null, null, null];
  }
}
