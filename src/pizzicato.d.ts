declare module 'pizzicato' {
  export class Group {
    constructor(sounds?: []);
    addSound(sound: Sound): null;
    removeSound(sound: Sound): null;
    play(): null;
    stop(): null;
    pause(): null;
    addEffect(effect: BaseEffect): Group;
    removeEffect(effect: BaseEffect): Group;
  }

  export abstract class BaseEffect {
    constructor(options?: {});
  }
  namespace Effects {
    export class Compressor extends BaseEffect {}
    export class Convolver extends BaseEffect {}
    export class Delay extends BaseEffect {}
    export class Distortion extends BaseEffect {}
    export class DubDelay extends BaseEffect {}
    export abstract class Filter extends BaseEffect {}
    export class LowPassFilter extends Filter {}
    export class HighPassFilter extends Filter {}
    export class Flanger extends BaseEffect {}
    export class PingPongDelay extends BaseEffect {}
    export class Quadrafuzz extends BaseEffect {}
    export class Reverb extends BaseEffect {}
    export class RingModulator extends BaseEffect {}
    export class StereoPanner extends BaseEffect {}
    export class Tremolo extends BaseEffect {}
  }

  export class Sound {
    constructor(description?: {}, callback?: Function);
    play(when?: Number, offset?: number): null;
    stop(): null;
    pause(): null;
    clone(): Sound;
    addEffect(effect: BaseEffect): Sound;
    removeEffect(effect: BaseEffect): Sound;
  }
}
