declare module 'gibberish-dsp' {

  interface ugen {
    frequency?: number;
    gain?: number;
    connect?(): void;
    disconnect?(): void;
  }
  type instrument = object;
  type effect = object;

  namespace oscillators {
    function Sine(inputProps: Record<string, unknown>): ugen;
    function Triangle(inputProps: Record<string, unknown>): ugen;
    function Saw(inputProps: Record<string, unknown>): ugen;
    function Square(inputProps: Record<string, unknown>): ugen;
  }

  namespace fx {
    function Vibrato(inputProps: Record<string, unknown>): ugen;
    function Tremolo(inputProps: Record<string, unknown>): ugen;
  }

  namespace binops {
    interface MulNode extends ugen {
      [index: number]: ugen | number;
    }
    function Mul(a: ugen | number, b: ugen | number): MulNode;
  }

  function init(memAmount?: number, ctx?: AudioContext): void;
  const ctx: AudioContext | undefined;
  let workletPath: string;
}
