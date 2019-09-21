import AudioMod from './audio-mod';
import PlugType from './plug-type';
import { Signals, AudioSignal, ControlSignal } from './signal';
import PlugPosition from './plug-position';
import { AudioContext, OscillatorNode, GainNode } from 'standardized-audio-context';

export default class Note extends AudioMod {
  gain: GainNode<AudioContext>|null = null;
  oscillator: OscillatorNode<AudioContext>|null = null;

  constructor() {
    super();
    this.configure('note', 1, 1, [PlugType.NULL, PlugType.CTRLIN, PlugType.OUT]);
  }

  getOutputs(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];

    const controlSignal = inputSignals[PlugPosition.EAST];
    if (
      controlSignal instanceof ControlSignal
      && this.audioContext
    ) {
      if (controlSignal.value === 1) {
        this.gain = this.audioContext.createGain();

        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.value = 440;

        this.oscillator.start(this.audioContext.currentTime);
      } else if (this.gain && this.oscillator) {
        const duration = 0.1;
        this.gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + duration);
        this.oscillator.stop(this.audioContext.currentTime + duration);
      }

      if (this.oscillator) {
        outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.oscillator);
      }
    }

    return outputSignals;
  }
}
