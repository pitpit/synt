import Mod from './mod';
import PlugType from './plug-type';
import { Signals, AudioSignal, ControlSignal } from './signal';
import PlugPosition from './plug-position';
import { AudioContext, OscillatorNode, GainNode } from 'standardized-audio-context';

export default class Note extends Mod {
  play: boolean = false;

  constructor() {
    super();

    this.configure('note', 1, 1, [PlugType.NULL, PlugType.CTRLIN, PlugType.OUT]);
  }

  process(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];

    if (this.audioContext && this.play) {
      const gain = this.audioContext.createGain();

      const oscillator = this.audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 440;

      const duration = 0.1;
      gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + duration);
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      outputSignals[PlugPosition.SOUTH] = new AudioSignal(oscillator);
      this.play = false;
    }

    outputSignals[PlugPosition.EAST] = new ControlSignal((value: number) => {
      if (this.audioContext && value === 1) {
        this.play = true;
        this.push(this._generateProcessId());
      }
    });

    return outputSignals;
  }
}
