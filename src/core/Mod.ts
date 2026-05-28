import Konva from 'konva';
import EventEmitter from 'eventemitter3';
import Rack from './Rack';
import Plugs from './Plugs';
import Plug from './Plug';
import PlugType from './PlugType';
import PlugPosition from './PlugPosition';
import Signals from './Signals';
import { Signal } from './Signal';


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

  group: Konva.Group | null = null;

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
    plugTypes:Array<symbol> = [PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.NULL],
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
    stageWidth: number,
    stageHeight: number,
  ): void {
    this.group = group;
    const strokeWidth = 5;

    group.position({
      x: this.x * slotWidth + padding,
      y: this.y * slotHeight + padding,
    });

    this.drawVisual(group, slotWidth, slotHeight);

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
      document.body.style.cursor = '';

      if (!this.rack) {
        return;
      }

      // Check delete zone before any clamping (raw pixel coords)
      this.events.emit('deleteZoneChange', false);
      const deleteResult = { inDeleteZone: false };
      this.events.emit('checkDeleteZone', group.x(), group.y(), this.width * slotWidth, this.height * slotHeight, deleteResult);
      if (deleteResult.inDeleteZone) {
        shadow.hide();
        this.events.emit('delete');
        return;
      }

      // Compute new Mod position
      let x = Math.round(group.x() / slotWidth);
      let y = Math.round(group.y() / slotHeight);
      x = Math.max(0, Math.min(x, stageWidth - this.width));
      // No lower-bound clamp on y: mods dragged above rack snap back
      y = Math.min(y, stageHeight - this.height);

      if (y < 0 || this.rack.isBusy(x, y, this)) {
        // Out of bounds (above rack) or busy: snap back to last valid position
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

      // Check delete zone using full bounding box
      const moveResult = { inDeleteZone: false };
      this.events.emit('checkDeleteZone', group.x(), group.y(), this.width * slotWidth, this.height * slotHeight, moveResult);

      if (moveResult.inDeleteZone) {
        shadow.hide();
        this.events.emit('deleteZoneChange', true);
        group.getStage()?.batchDraw();
        return;
      }

      this.events.emit('deleteZoneChange', false);

      // Above the main rack (but not in delete zone): hide snap shadow
      if (group.y() < 0) {
        shadow.hide();
        group.getStage()?.batchDraw();
        return;
      }

      // Back in the main rack area: restore normal cursor
      document.body.style.cursor = '';

      // Restore shadow visibility if it was hidden while above rack
      shadow.show();

      // Compute new position
      let x = Math.round(group.x() / slotWidth);
      let y = Math.round(group.y() / slotHeight);
      x = Math.max(0, Math.min(x, stageWidth - this.width));
      y = Math.max(0, Math.min(y, stageHeight - this.height));

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

    group.on('dblclick dbltap', () => {
      this.events.emit('dblclick');
    });
  }

  /**
   * Draw the mod visual (background rect, label, plug indicators, custom draw)
   * into a group without setting its position or attaching drag events.
   * Used by SystemRack to render prototype tiles with the same appearance as
   * main-rack mods.
   */
  drawVisual(group: Konva.Group, slotWidth: number, slotHeight: number): void {
    const strokeWidth = 5;

    group.size({
      width: this.width * slotWidth,
      height: this.height * slotHeight,
    });

    const rect = new Konva.Rect({
      x: strokeWidth / 2,
      y: strokeWidth / 2,
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
      plug.draw(group, plugPosition, this.width, this.height, slotWidth, slotHeight, strokeWidth);
    });

    this.draw(group);
  }

  /**
   * Is the mod an entry?
   * A mod is an entry if it has at least one linked OUT plug and no IN plug (linked or not)
   */
  isEntry(): boolean {
    const haveIn = this.plugs.items.some((plug: Plug) => plug.type === PlugType.IN);
    const haveLinkedOut = this.plugs.items.some((plug: Plug) => plug.isOutput());
    return haveLinkedOut && !haveIn;
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
    // Notify e2e tests that a plug connection was established.
    window.dispatchEvent(new CustomEvent('test:mod:link'));

    this.onLinked(plugPosition, target);

    // Reserse link
    target.link(oppositePlugPosition, this);
  }

  /**
   * Hook called when a link is established from this mod to a target.
   * Subclasses can override it for connection side effects.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onLinked(plugPosition: number, target: Mod): void {
    // Do nothing by default
  }

  /**
   * Hook called when a link from this mod to a previously connected mod is broken.
   * Subclasses can override it to disconnect Tone.js nodes or clean up state.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onUnlinked(plugPosition: number, prev: Mod): void {
    // Do nothing by default
  }

  /**
   * Hook called after all plugs have been unlinked in snatch().
   * Subclasses can override it to dispose Tone.js nodes.
   */
  protected onSnatched(): void {
    // Do nothing by default
  }

  /**
   * TODO move it to Plugs or Plug
   */
  unlink(plugPosition: number): void {
    const plug = this.plugs.getPlug(plugPosition);
    if (plug.mod) {
      const { mod } = plug;
      this.onUnlinked(plugPosition, mod);
      plug.mod = null;
      // Notify e2e tests that a plug connection was removed.
      window.dispatchEvent(new CustomEvent('test:mod:unlink'));

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
   * Unlinks each plug (triggering onUnlinked hooks for Tone.js cleanup),
   * then calls onSnatched() for final node disposal.
   */
  snatch(): void {
    this.plugs.forEach((_plug: Plug, plugPosition: number) => {
      this.unlink(plugPosition);
    });
    this.onSnatched();
  }

  private static generateProcessId(): string {
    return Math.random().toString(36).substring(2, 11);
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
    this.inputSignals[plugPosition] = inputSignal;
    if (inputSignal && oldInputSignal && inputSignal.eq(oldInputSignal)) {
      // Do not recompute output but propagate it directly
      outputSignals = this.outputSignals;
    } else {
      const snapshot: Signals = [
        this.inputSignals[0],
        this.inputSignals[1],
        this.inputSignals[2],
        this.inputSignals[3],
      ];
      outputSignals = this.processInputs(snapshot);
    }

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

  /**
   * Return the latest input signal received on a given plug.
   */
  getInputSignal(plugPosition: number): Signal|null {
    return this.inputSignals[plugPosition];
  }
}
