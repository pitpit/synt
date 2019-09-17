import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';

export default class Note extends Mod {
  gain: GainNode|null = null;

  constructor() {
    super();

    this.configure('note', 1, 1, [PlugType.NULL, PlugType.CTRL, PlugType.OUT]);
  }

  // getOutput(plugPosition: number): any {
  //   // This is the sound output
  //   if (PlugPosition.SOUTH === plugPosition) {
  //     return this.gain;
  //   }

  //   // This is the control plug to plug in a knob
  //   if (PlugPosition.EAST === plugPosition) {
  //     return () => {
  //       if (this.gain && this.audioContext) {
  //         const duration = 2;

  //         // This is a dirty fix: I don't know why but
  //         // gain and oscialltor has to be rebuilt because they seems to be
  //         // one time use
  //         this.gain = this.audioContext.createGain();

  //         const oscillator = this.audioContext.createOscillator();
  //         oscillator.type = 'sine';
  //         oscillator.frequency.value = 440;
  //         this.gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + duration);
  //         oscillator.connect(this.gain);

  //         // Follow-up the dirty fix: here we trigger onLinked on the plugged Mod
  //         // to be sure it has the last GainNode object
  //         const mod = this._getLinkedMod(PlugPosition.SOUTH);
  //         if (mod) {
  //           mod.onLinked(this.audioContext);
  //         }
  //         oscillator.start(this.audioContext.currentTime);
  //         oscillator.stop(this.audioContext.currentTime + duration);
  //       }
  //     };
  //   }

  //   return null;
  // }

  // onLinked(audioContext:AudioContext): void {
  //   if (!this.gain) {
  //     this.gain = audioContext.createGain();
  //   }
  // }

  // onUnlinked(audioContext:AudioContext): void {
  //   if (this.gain) {
  //     this.gain = null;
  //   }
  // }
}
