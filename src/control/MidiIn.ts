import Konva from 'konva';
import { AmplitudeEnvelope as ToneEnvelope } from 'tone';
import type { ToneAudioNode } from 'tone';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import ControlSignal from '../core/ControlSignal';
import Modal from '../ui/Modal';

export default class MidiIn extends EffectMod {
  private static instanceCounter = 0;

  private readonly uid: string;

  private readonly modal: Modal;

  private midiAccess: MIDIAccess | null = null;

  private selectedInputId: string | null = null;

  /** MIDI note number currently held down, or null when the gate is closed. */
  private activeNote: number | null = null;

  constructor() {
    super();
    MidiIn.instanceCounter += 1;
    this.uid = `midiin-${String(MidiIn.instanceCounter)}`;
    this.configure([PlugType.IN, PlugType.NULL, PlugType.OUT, PlugType.CTRLOUT]);

    this.modal = new Modal();
    this.modal.events.on('save', () => { this.onModalSave(); });
    this.events.on('dblclick', () => { void this.openModal(); });
  }

  protected createEffectNode(): ToneAudioNode {
    return new ToneEnvelope();
  }

  /**
   * Process a raw MIDI message.
   * Public so integration tests can inject messages without real MIDI hardware.
   */
  receiveMIDIMessage(status: number, data1: number, data2: number): void {
    const command = status & 0xf0;
    const channel = status & 0x0f;

    // Ignore realtime / sysex messages (status byte ≥ 0xF0)
    if (status >= 0xf0) return;

    // eslint-disable-next-line no-console
    console.log(`[MidiIn] cmd=0x${command.toString(16).toUpperCase()} ch=${String(channel + 1)} data1=${String(data1)} data2=${String(data2)}`);


    // Release path: close gate when the currently active note is released
    if (this.activeNote !== null && data1 === this.activeNote) {
      if (command === 0x80 || (command === 0x90 && data2 === 0)) {
        this.activeNote = null;
        (this.ensureEffectNode() as ToneEnvelope).triggerRelease();
        return;
      }
    }

    if (command !== 0x90) return;

    // NoteOn with velocity 0: if it reached here, it is NOT releasing the
    // active note (that case returned above). Some devices always send vel=0
    // and rely on separate NoteOff messages for release — treat it as a press
    // with a default velocity of 64.
    const effectiveData2 = data2 === 0 ? 64 : data2;

    this.activeNote = data1;
    this.pushOutput(PlugPosition.WEST, new ControlSignal(MidiIn.noteToCV(data1)));
    (this.ensureEffectNode() as ToneEnvelope).triggerAttack(undefined, effectiveData2 / 127);
  }

  private static noteToCV(note: number): number {
    // Converts a MIDI note number to a CV value in the oscillator's 0–1 → 0–400 Hz scale.
    return 440 * Math.pow(2, (note - 69) / 12) / 400;
  }

  private attachListener(): void {
    if (!this.midiAccess || !this.selectedInputId) return;
    const input = this.midiAccess.inputs.get(this.selectedInputId);
    if (!input) return;

    input.onmidimessage = (event) => {
      const d = event.data;
      if (!d) return;
      this.receiveMIDIMessage(d[0], d[1], d.length > 2 ? d[2] : 127);
    };
  }

  private detachCurrentListener(): void {
    if (!this.midiAccess || !this.selectedInputId) return;
    const input = this.midiAccess.inputs.get(this.selectedInputId);
    if (input) input.onmidimessage = null;
    this.activeNote = null;
  }

  private onModalSave(): void {
    const select = document.getElementById(`${this.uid}-input-select`) as HTMLSelectElement | null;

    if (!select) return;
    const newId = select.value;
    if (!newId || newId === this.selectedInputId) return;

    this.detachCurrentListener();
    this.selectedInputId = newId;
    this.attachListener();
  }

  private async openModal(): Promise<void> {
    if (!this.midiAccess) {
      // requestMIDIAccess is typed as always-present in lib.dom.d.ts but may be
      // absent at runtime on Firefox, Safari, and other non-supporting browsers.
      // A unified try-catch handles both the missing-API and permission-denied cases.
      try {
        this.midiAccess = await navigator.requestMIDIAccess();
        this.midiAccess.onstatechange = () => { this.attachListener(); };
      } catch {
        this.modal.setContent(
          '<p style="padding:16px">MIDI unavailable — check browser support and permissions.</p>',
        );
        this.modal.open();
        return;
      }
    }

    this.renderModal();
  }

  private renderModal(): void {
    const inputs = this.midiAccess
      ? Array.from(this.midiAccess.inputs.entries())
      : [];

    const opts = inputs.length
      ? inputs
          .map(([id, input]) =>
            `<option value="${id}"${id === this.selectedInputId ? ' selected' : ''}>${input.name || id}</option>`,
          )
          .join('')
      : '<option value="" disabled selected>No MIDI inputs detected</option>';

    this.modal.setContent(`
      <div style="padding:16px;font-family:'Courier New',monospace">
        <label style="display:block;margin-bottom:4px">MIDI Input</label>
        <select id="${this.uid}-input-select" style="width:100%;padding:4px">${opts}</select>
      </div>`);

    this.modal.open();
  }

  draw(group: Konva.Group): void {
    const cx = group.width() / 2;
    const cy = group.height() / 2 - 6;

    // DIN-5 MIDI connector outline
    group.add(new Konva.Circle({
      x: cx, y: cy, radius: 24, stroke: 'black', strokeWidth: 3,
    }));

    // 5 pin holes in standard DIN-5 pattern
    const pins: [number, number][] = [
      [cx - 9,  cy - 8],
      [cx + 9,  cy - 8],
      [cx - 14, cy + 6],
      [cx + 14, cy + 6],
      [cx,      cy + 12],
    ];
    pins.forEach(([px, py]) => {
      group.add(new Konva.Circle({ x: px, y: py, radius: 1.5, fill: 'black' }));
    });

    group.add(new Konva.Text({
      x: 0,
      y: group.height() - 24,
      width: group.width(),
      text: 'midi in',
      fontSize: 11,
      fontFamily: '"Courier New", Courier, monospace',
      fill: 'black',
      align: 'center',
    }));
  }

  override onAdded(): void {
    void this.autoSelectFirstInput();
  }

  private async autoSelectFirstInput(): Promise<void> {
    let access: MIDIAccess;
    try {
      access = await navigator.requestMIDIAccess();
    } catch {
      return;
    }
    this.midiAccess = access;
    this.midiAccess.onstatechange = () => { this.attachListener(); };
    if (this.selectedInputId === null) {
      const firstEntry = access.inputs.entries().next();
      if (!firstEntry.done) {
        const [id] = firstEntry.value;
        this.selectedInputId = id;
      }
    }
    this.attachListener();
  }

  protected override onSnatched(): void {
    this.detachCurrentListener();
    super.onSnatched();
  }
}
