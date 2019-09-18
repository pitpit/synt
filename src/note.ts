import Mod from './mod';
import PlugType from './plug-type';
import { Signals, AudioSignal, ControlSignal } from './signal';
import PlugPosition from './plug-position';
import { AudioContext, OscillatorNode, GainNode } from 'standardized-audio-context';

export default class Note extends Mod {
  oscillator: OscillatorNode<AudioContext>|null = null;
  gain: GainNode<AudioContext>|null = null;

  constructor() {
    super();

    this.configure('note', 1, 1, [PlugType.NULL, PlugType.CTRLIN, PlugType.OUT]);
  }

  process(inputSignals: Signals): Signals {
    console.log(this.constructor.name + ' >process');
    const outputSignals: Signals = [null, null, null, null];

    outputSignals[PlugPosition.EAST] = new ControlSignal((value: number) => {
      if (this.audioContext) {
        this.gain = this.audioContext.createGain();

        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.value = 440;


        console.log(this.constructor.name + ' > a sound has been emit');
        const duration = 2;
        this.gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + duration);

        this.oscillator.start(0);
        this.oscillator.stop(this.audioContext.currentTime + duration);
       // this.oscillator.frequency.value = value * 1400 + 40;
        outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.oscillator);
      }
    });

    return outputSignals;
  }
}
