import Konva from 'konva';
import EventEmitter from 'eventemitter3';
import Rack from './Rack';
import Plugs from './Plugs';
import Plug from './Plug';
import PlugType from './PlugType';
import PlugPosition from './PlugPosition';
import Signals from './Signals';
import { Signal } from './Signal';
import BrokenAudioSignal from './BrokenAudioSignal';
import AudioSignal from './AudioSignal';

export default abstract class Mod {
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
   * @override
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  draw(group:Konva.Group): void {
    // Do nothing by default
  }

  /**
   * Will be triggered on first link and then if input signal changed
   * @override
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSignalChanged(inputSignals: Signals): Signals {
    return [null, null, null, null];
  }

  /**
   * Configure the Mod
   * @helper
   */
  configure(
    plugTypes:Array<Symbol> = [PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.NULL],
    label: string = '',
    width:number = 1,
    height:number = 1,
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
      x: 0 + strokeWidth / 2,
      y: 0 + strokeWidth / 2,
      width: this.width * slotWidth - strokeWidth,
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
      x: this.x * slotWidth + padding + strokeWidth / 2,
      y: this.y * slotHeight + padding + strokeWidth / 2,
      width: this.width * slotWidth,
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
      this.plugs.forEach((plug: Plug) => {
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
    this.plugs.forEach((plug: Plug) => {
      if (plug.mod && plug.isInput()) {
        const likedModEntries = plug.mod.findEntries();
        entries = [...entries, ...likedModEntries];
      }
    });
    return entries;
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

    // Go back following the link chain to find entries
    // look for mods with at least one linked OUT plug or one linked CTRLOUT plug
    // and with no linked mods on IN plug or a CTRLIN plug
    this.findEntries().forEach((mod) => {
      mod.start();
    });
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
  }

  /**
   * TODO move it to Plugs or Plug
   */
  unlink(plugPosition: number): void {
    const plug = this.plugs.getPlug(plugPosition);
    if (plug.mod) {
      const { mod } = plug;
      plug.mod = null;

      // Reverse unlink target Mod
      mod.unlink(PlugPosition.opposite(plugPosition));
    }
  }

  /**
   * Compute state changes on plugs and trigger Mod onChange
   */
  private processInputs(inputSignals: Signals): Signals {
    let outputSignals: Signals = [null, null, null, null];

    outputSignals = this.onSignalChanged(inputSignals);

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
   * Snatch current Mod from linked Mods.
   * then it unlinks each plug.
   */
  snatch(): void {
    // this.plugs.resetUntriggeredLinkedInput();

    this.plugs.forEach((plug: Plug, plugPosition: number) => {
      this.breakSignal(plugPosition);
    });

    this.plugs.forEach((plug: Plug, plugPosition: number) => {
      this.unlink(plugPosition);
    });

    // Redo propagation
    // const outputSignals: Signals = this.processInputs(this.inputSignals);
    // this.pushOutputs(outputSignals);
  }

  /**
   * break the signal on a given plug
   */
  private breakSignal(plugPosition: number) {
    const plug = this.plugs.getPlug(plugPosition);
    if (plug.isInput()) {
      const previousSignal = this.inputSignals[plugPosition];
      if (previousSignal instanceof AudioSignal) {
        const signal = new BrokenAudioSignal(previousSignal.node);
        this.pushInput(plugPosition, signal);
      }
    } else if (plug.mod && plug.isOutput()) {
      const oppositePlugPosition = PlugPosition.opposite(plugPosition);
      plug.mod.breakSignal(oppositePlugPosition);
    }
  }

  private static generateProcessId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Push an input signal to a plug.
   * TODO move it to Plugs ?
   */
  pushInput(plugPosition: number, inputSignal: Signal|null, id: string|null = null): void {
    let givenId: string;
    if (!id) {
      givenId = Mod.generateProcessId();
    } else {
      givenId = id;
    }

    if (givenId === this.lastPropagationId) {
      return;
    }
    this.lastPropagationId = givenId;

    let outputSignals: Signals;
    const oldInputSignal = this.inputSignals[plugPosition];
    const inputSignals: Signals = [null, null, null, null];
    inputSignals[plugPosition] = inputSignal;
    if (inputSignal && oldInputSignal && inputSignal.eq(oldInputSignal)) {
      // Do not recompute output but propagate it directly
      outputSignals = this.outputSignals;
    } else {
      outputSignals = this.processInputs(inputSignals);
    }
    this.inputSignals[plugPosition] = inputSignal;

    this.pushOutputs(outputSignals);
  }

  /**
   * Push all output signals to the outpout plugs.
   * TODO move it to Plugs ?
   */
  private pushOutputs(outputSignals:Signals): void {
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
    // TODO store outputSignal for later diff
    this.outputSignals[plugPosition] = outputSignal;

    const plug = this.plugs.getPlug(plugPosition);
    if (plug.mod && plug.isOutput()) {
      const oppositePlugPosition = PlugPosition.opposite(plugPosition);
      plug.mod.pushInput(oppositePlugPosition, outputSignal);
    }
  }
}
