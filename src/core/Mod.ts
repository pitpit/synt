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

  // Indexed by plug position; resized in configure() to match plugs.items.length
  inputSignals: Signals = [null, null, null, null];

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
    return Array(this.plugs.items.length).fill(null) as Signals;
  }

  /**
   * Configure the Mod.
   * plugTypes is a flat clockwise array of plug types around the module perimeter:
   *   NORTH left→right, EAST top→bottom, SOUTH right→left, WEST bottom→top.
   * For a 1×1 mod this is [N, E, S, W] (4 elements).
   * For an M×N mod this is 2*(width+height) elements.
   * @helper
   */
  configure(
    plugTypes: symbol[] = [PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.NULL],
    label: string = '',
    width: number = 1,
    height: number = 1,
  ): void {
    this.label = label;
    this.width = width;
    this.height = height;

    this.plugs.setTypes(plugTypes, width, height);

    const n = this.plugs.items.length;
    this.inputSignals = Array(n).fill(null) as Signals;
    this.outputSignals = Array(n).fill(null) as Signals;
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

    group.on('mouseenter', () => {
      if (!group.draggable()) return;
      document.body.style.cursor = 'grab';
    });
    group.on('mouseleave', () => {
      if (!group.draggable()) return;
      if (group.isDragging()) return;
      document.body.style.cursor = '';
    });

    group.on('dragstart', () => {
      document.body.style.cursor = 'grab';
      shadow.show();
      shadowVisible = true;
      shadowSlotX = this.x;
      shadowSlotY = this.y;
      shadow.moveToTop();
      group.moveToTop();

      this.events.emit('dragstart');
    });

    // Store the current position
    // to move the Mod back to this slot if dropped
    let targetX = this.x;
    let targetY = this.y;
    let shadowVisible = false;
    let shadowSlotX = targetX;
    let shadowSlotY = targetY;
    let drawScheduled = false;

    const scheduleStageDraw = (): void => {
      const stage = group.getStage();
      if (!stage || drawScheduled) return;
      drawScheduled = true;

      requestAnimationFrame(() => {
        drawScheduled = false;
        stage.batchDraw();
      });
    };

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
        shadowVisible = false;
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
        if (shadowVisible) {
          shadow.hide();
          shadowVisible = false;
          scheduleStageDraw();
        }
        this.events.emit('deleteZoneChange', true);
        return;
      }

      this.events.emit('deleteZoneChange', false);

      // Above the main rack (but not in delete zone): hide snap shadow
      if (group.y() < 0) {
        if (shadowVisible) {
          shadow.hide();
          shadowVisible = false;
          scheduleStageDraw();
        }
        return;
      }

      // Keep drag cursor locked until dragend
      document.body.style.cursor = 'grab';

      // Restore shadow visibility if it was hidden while above rack
      if (!shadowVisible) {
        shadow.show();
        shadowVisible = true;
        scheduleStageDraw();
      }

      // Compute new position
      let x = Math.round(group.x() / slotWidth);
      let y = Math.round(group.y() / slotHeight);
      x = Math.max(0, Math.min(x, stageWidth - this.width));
      y = Math.max(0, Math.min(y, stageHeight - this.height));

      if (!this.rack.isBusy(x, y, this)) {
        // Move the shadow to the current slot
        if (x !== shadowSlotX || y !== shadowSlotY) {
          shadow.position({
            x: padding + x * slotWidth,
            y: padding + y * slotHeight,
          });
          shadowSlotX = x;
          shadowSlotY = y;
          scheduleStageDraw();
        }

        // Store the position, to move the Mod to this position
        // if next slot is busy
        targetX = x;
        targetY = y;

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
    const haveOut = this.plugs.items.some((plug: Plug) => plug.type === PlugType.OUT);
    return haveOut && !haveIn;
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
   * Only considers canonical plugs (indices 0-3).
   */
  plug(targets: Array<Mod|null>): void {
    // this.plugs.resetUntriggeredLinkedInput();
    targets.forEach((target, plugPosition) => {
      if (target) {
        const fromPlug = this.plugs.getPlug(plugPosition);
        const oppSide = PlugPosition.opposite(plugPosition);
        const toIdx = target.plugs.findFirstBySide(oppSide);
        if (toIdx !== -1) {
          const toPlug = target.plugs.getPlug(toIdx);
          if (fromPlug.isLinkable(toPlug)) {
            this.link(plugPosition, target);
          }
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
  link(plugPosition: number, target: Mod, targetPlugIndex?: number): void {
    const plug = this.plugs.getPlug(plugPosition);
    const effSide = plug.side !== -1 ? plug.side : plugPosition;

    // Resolve which index on the target receives this connection.
    // Fall back to PlugPosition.opposite() for unconfigured mods (side=-1).
    const oppSide = PlugPosition.opposite(effSide);
    const foundIdx = targetPlugIndex !== undefined ? targetPlugIndex : target.plugs.findFirstBySide(oppSide);
    const resolvedTargetIdx = foundIdx !== -1 ? foundIdx : oppSide;

    if (plug.mod) {
      if (target === plug.mod) {
        // Already linked to Mod {target}, abort
        return;
      }
      // Unlink the currently connected mod to free the plug
      const oldRemote = plug.remoteIndex !== -1 ? plug.remoteIndex : resolvedTargetIdx;
      plug.mod.unlink(oldRemote);
    }

    plug.mod = target;
    plug.remoteIndex = resolvedTargetIdx;
    // Notify e2e tests that a plug connection was established.
    window.dispatchEvent(new CustomEvent('test:mod:link'));

    // Clear the target's receiving slot (if it's an input) before onLinked fires,
    // so the first incoming signal always triggers onSignalChanged even when the
    // value equals the stale cached entry from before the disconnect.
    const targetPlug = target.plugs.getPlug(resolvedTargetIdx);
    if (targetPlug.isInput()) {
      target.inputSignals[resolvedTargetIdx] = null;
    }

    this.onLinked(plugPosition, target);

    // Reverse link (pass our index so the target knows which slot to map back)
    target.link(resolvedTargetIdx, this, plugPosition);

    // Replay the cached output signal to the newly connected target.
    if (plug.isOutput()) {
      const cachedOutput = this.outputSignals[plugPosition];
      const hasInputPlugs = this.plugs.items.some((p: Plug) => p.isInput());
      const hasLinkedInput = this.plugs.items.some((p: Plug) => p.isInput() && p.mod !== null);
      if (cachedOutput && (!hasInputPlugs || hasLinkedInput)) {
        target.pushInput(resolvedTargetIdx, cachedOutput);
      }
    }
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
   * Hook called when the mod is first placed in the rack via addMod().
   * Subclasses can override it to perform initialization that requires
   * the mod to be live in the rack (e.g. requesting browser permissions).
   */
  onAdded(): void {
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
      const remoteIdx = plug.remoteIndex;
      this.onUnlinked(plugPosition, mod);
      plug.mod = null;
      plug.remoteIndex = -1;
      // Notify e2e tests that a plug connection was removed.
      window.dispatchEvent(new CustomEvent('test:mod:unlink'));

      // Reverse unlink target Mod
      if (remoteIdx !== -1) {
        mod.unlink(remoteIdx);
      } else {
        const effSide = plug.side !== -1 ? plug.side : plugPosition;
        mod.unlink(PlugPosition.opposite(effSide));
      }
    }
  }

  /**
   * Compute state changes on plugs and trigger Mod onChange
   */
  private processInputs(inputSignals: Signals): Signals {
    return this.onSignalChanged(inputSignals);
  }

  /**
   * Start the signal chain.
   * It computes output signals from empty signals then
   * it propagate them to every output plugs.
   */
  start() {
    this.inputSignals = Array(this.plugs.items.length).fill(null) as Signals;
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
    if (inputSignal) {
      this.events.emit('input', plugPosition, inputSignal);
    }
    if (inputSignal && oldInputSignal && inputSignal.eq(oldInputSignal)) {
      // Do not recompute output but propagate it directly
      outputSignals = this.outputSignals;
    } else {
      outputSignals = this.processInputs([...this.inputSignals] as Signals);
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
    this.outputSignals[plugPosition] = outputSignal;

    const plug = this.plugs.getPlug(plugPosition);
    if (plug.mod && plug.isOutput()) {
      const targetIdx = plug.remoteIndex !== -1
        ? plug.remoteIndex
        : PlugPosition.opposite(plug.side !== -1 ? plug.side : plugPosition);
      plug.mod.pushInput(targetIdx, outputSignal);
    }
  }

  /**
   * Return the latest input signal received on a given plug.
   */
  getInputSignal(plugPosition: number): Signal|null {
    return this.inputSignals[plugPosition];
  }

}
