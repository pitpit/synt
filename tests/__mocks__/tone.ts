const createGainNode = () => ({
  gain: { value: 0.5 },
  input: {
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
  },
  connect: jest.fn(),
  disconnect: jest.fn(),
  dispose: jest.fn(),
});

const Gain = jest.fn(() => createGainNode());

const getDestination = jest.fn(() => ({}));

const createEffectNode = () => {
  let disposed = false;
  return {
    connect: jest.fn(),
    disconnect: jest.fn().mockImplementation(() => {
      if (disposed) {
        throw new DOMException(
          'The AudioNode to be disconnected is not connected.',
          'InvalidAccessError',
        );
      }
    }),
    dispose: jest.fn().mockImplementation(() => { disposed = true; }),
    feedback: { value: 0 },
    frequency: { value: 0 },
    depth: { value: 0 },
    pan: { value: 0 },
    wet: { value: 0 },
    decay: 0,
    start: jest.fn().mockReturnThis(),
  };
};

const Chorus = jest.fn(() => createEffectNode());
const Filter = jest.fn(() => createEffectNode());

const createWaveformNode = (size: number) => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  dispose: jest.fn(),
  getValue: jest.fn().mockReturnValue(new Float32Array(size)),
});

const Waveform = jest.fn((size: number) => createWaveformNode(size));

const createAnalyserNode = (size: number) => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  dispose: jest.fn(),
  getValue: jest.fn().mockReturnValue([new Float32Array(size), new Float32Array(size)]),
});

const Analyser = jest.fn((_opts: { type: string; size: number; channels: number }) =>
  createAnalyserNode(_opts.size ?? 1024));
const Vibrato = jest.fn(() => createEffectNode());
const Tremolo = jest.fn(() => createEffectNode());
const Panner = jest.fn(() => createEffectNode());
const Phaser = jest.fn(() => createEffectNode());
const Reverb = jest.fn(() => createEffectNode());

export {
  Gain,
  getDestination,
  Analyser,
  Chorus,
  Filter,
  Waveform,
  Vibrato,
  Tremolo,
  Panner,
  Phaser,
  Reverb,
};
