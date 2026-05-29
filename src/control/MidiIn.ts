import Konva from 'konva';
import { Gain as ToneGain } from 'tone';
import type { ToneAudioNode } from 'tone';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import ControlSignal from '../core/ControlSignal';
import Modal from '../ui/Modal';

interface LearnedSignature {
  command: number;
  channel: number;
  data1: number;
}

function signatureLabel(sig: LearnedSignature): string {
  const ch = String(sig.channel + 1);
  const note = String(sig.data1);
  switch (sig.command) {
    case 0x90: return `Note On Ch${ch} note ${note}`;
    case 0x80: return `Note Off Ch${ch} note ${note}`;
    case 0xa0: return `Aftertouch Ch${ch} note ${note}`;
    case 0xb0: return `CC Ch${ch} #${note}`;
    case 0xc0: return `Program Ch${ch}`;
    case 0xd0: return `Ch Pressure Ch${ch}`;
    case 0xe0: return `Pitch Bend Ch${ch}`;
    default:   return `0x${sig.command.toString(16).toUpperCase()} Ch${ch}`;
  }
}

export default class MidiIn extends EffectMod {
  private readonly modal: Modal;

  private midiAccess: MIDIAccess | null = null;

  private selectedInputId: string | null = null;

  private learnPending = false;

  private learnedSignature: LearnedSignature | null = null;

  /** MIDI note number currently held down, or null when the gate is closed. */
  private activeNote: number | null = null;

  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.NULL, PlugType.OUT, PlugType.CTRLOUT]);

    this.modal = new Modal();
    this.modal.events.on('save', () => { this.onModalSave(); });
    this.events.on('dblclick', () => { void this.openModal(); });
  }

  protected createEffectNode(): ToneAudioNode {
    return new ToneGain(0);
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

    if (this.learnPending) {
      this.learnedSignature = { command, channel, data1 };
      this.learnPending = false;
      // Update modal status in real-time if it is currently open
      const statusEl = document.getElementById('midiin-status');
      if (statusEl) statusEl.textContent = `Learned: ${signatureLabel(this.learnedSignature)}`;
      // Push initial pitch CV when the learned message is a NoteOn
      if (command === 0x90) {
        this.pushOutput(PlugPosition.WEST, new ControlSignal(MidiIn.noteToCV(data1)));
      }
      return;
    }

    const sig = this.learnedSignature;
    if (!sig) return;

    // Release path: close gate when the currently active note is released
    if (this.activeNote !== null && data1 === this.activeNote) {
      if (command === 0x80 || (command === 0x90 && data2 === 0)) {
        this.activeNote = null;
        this.setGain(0);
        return;
      }
    }

    // NoteOn signatures are chromatic: any note on the learned channel triggers.
    // All other signatures (CC, Program Change, …) require an exact match.
    const isNoteOnSig = sig.command === 0x90;
    const matches = isNoteOnSig
      ? command === 0x90 && channel === sig.channel
      : command === sig.command && channel === sig.channel && data1 === sig.data1;

    if (!matches) return;

    // NoteOn with velocity 0 is treated as release
    if (command === 0x90 && data2 === 0) {
      this.setGain(0);
      return;
    }

    // Trigger: for NoteOn signatures track active note and push pitch CV to WEST
    if (isNoteOnSig) {
      this.activeNote = data1;
      this.pushOutput(PlugPosition.WEST, new ControlSignal(MidiIn.noteToCV(data1)));
    }
    this.setGain(data2 / 127);
  }

  /**
   * Enter learn mode: the next received MIDI message becomes the trigger signature.
   * Also used in integration tests to bypass real MIDI hardware.
   */
  beginLearn(): void {
    this.learnedSignature = null;
    this.learnPending = true;
    this.activeNote = null;
  }

  private static noteToCV(note: number): number {
    // Converts a MIDI note number to a CV value in the oscillator's 0–1 → 0–400 Hz scale.
    return 440 * Math.pow(2, (note - 69) / 12) / 400;
  }

  private setGain(value: number): void {
    // Guard against NaN (e.g. 2-byte MIDI messages where data2 is absent at runtime)
    (this.ensureEffectNode() as ToneGain).gain.value = Number.isFinite(value) ? value : 0;
  }

  private attachListener(): void {
    if (!this.midiAccess || !this.selectedInputId) return;
    const input = this.midiAccess.inputs.get(this.selectedInputId);
    if (!input) return;

    // Start learn mode only when subscribing to a fresh input with no stored signature
    if (!this.learnedSignature && !this.learnPending) {
      this.learnPending = true;
    }

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
    this.learnPending = false;
    this.activeNote = null;
  }

  private onModalSave(): void {
    const select = document.getElementById('midiin-input-select') as HTMLSelectElement | null;
    if (!select) return;
    const newId = select.value;
    if (!newId || newId === this.selectedInputId) return;

    this.detachCurrentListener();
    this.selectedInputId = newId;
    this.learnedSignature = null;
    this.attachListener();
  }

  private async openModal(): Promise<void> {
    // requestMIDIAccess is typed as always-present in lib.dom.d.ts but may be
    // absent at runtime on Firefox, Safari, and other non-supporting browsers.
    // A unified try-catch handles both the missing-API and permission-denied cases.
    let access: MIDIAccess;
    try {
      access = await navigator.requestMIDIAccess();
    } catch {
      this.modal.setContent(
        '<p style="padding:16px">MIDI unavailable — check browser support and permissions.</p>',
      );
      this.modal.open();
      return;
    }

    this.midiAccess = access;
    this.midiAccess.onstatechange = () => { this.attachListener(); };
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

    const statusText = this.learnedSignature
      ? `Learned: ${signatureLabel(this.learnedSignature)}`
      : this.selectedInputId
        ? 'Waiting for first message\u2026'
        : '';

    this.modal.setContent(`
      <div style="padding:16px;font-family:'Courier New',monospace">
        <label style="display:block;margin-bottom:4px">MIDI Input</label>
        <select id="midiin-input-select" style="width:100%;padding:4px">${opts}</select>
        <div style="margin-top:8px;display:flex;align-items:center;gap:8px">
          <button id="midiin-learn-btn" style="padding:4px 10px;font-family:inherit;cursor:pointer">Learn</button>
          <span id="midiin-status" style="font-size:12px;color:#555">${statusText}</span>
        </div>
      </div>`);

    const learnBtn = document.getElementById('midiin-learn-btn');
    if (learnBtn) {
      learnBtn.addEventListener('click', () => {
        const select = document.getElementById('midiin-input-select') as HTMLSelectElement | null;
        const chosenId = select?.value ?? '';
        if (chosenId && chosenId !== this.selectedInputId) {
          this.detachCurrentListener();
          this.selectedInputId = chosenId;
        }
        if (!this.selectedInputId) return;
        this.beginLearn();
        this.attachListener();
        const statusEl = document.getElementById('midiin-status');
        if (statusEl) statusEl.textContent = 'Waiting for first message\u2026';
      });
    }

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

  protected override onSnatched(): void {
    this.detachCurrentListener();
    super.onSnatched();
  }
}
