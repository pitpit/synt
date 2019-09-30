declare module 'gibberish-dsp' {

  interface ugen {}
  interface instrument {}
  interface effect {}

  namespace oscillators {
    function Sine(inputProps: {}): ugen;
    function Triangle(inputProps: {}): ugen;
    function Saw(inputProps: {}): ugen;
    function Square(inputProps: {}): ugen;
  }

  namespace fx {
    function Vibrato(inputProps: {}): ugen;
    function Tremolo(inputProps: {}): ugen;
  }

  function init(memAmount: number|void, ctx: AudioContext|void): void;
  const ctx: AudioContext;
}
