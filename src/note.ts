import Mod from './mod';
import PlugType from './plug-type';
import { Signals, AudioSignal, ControlSignal } from './signal';
import PlugPosition from './plug-position';

export default class Note extends Mod {
  oscillator: OscillatorNode|null = null;
  gain: GainNode|null = null;

  constructor() {
    super();

    this.configure('note', 1, 1, [PlugType.NULL, PlugType.CTRL, PlugType.OUT]);
  }

  process(inputSignals: Signals): Signals {
    console.log('process')
    const outputSignals: Signals = [null, null, null, null];
    if (this.audioContext) {
      // This is a dirty fix: I don't know why but
      // gain and oscialltor has to be rebuilt because they seems to be
      // one time use
      this.gain = this.audioContext.createGain();

      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = 440;

      outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.oscillator);
    }

    outputSignals[PlugPosition.EAST] = new ControlSignal((value: number) => {
      console.log('aaa')
      if (this.audioContext && this.oscillator && this.gain) {

        const duration = 2;
        this.gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + duration);

        this.oscillator.start(0);
        this.oscillator.stop(this.audioContext.currentTime + duration);
       // this.oscillator.frequency.value = value * 1400 + 40;
      }
    });

    return outputSignals;
  }
}
