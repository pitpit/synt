const createGainNode = () => ({
  gain: { value: 0.5 },
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
    frequency: { value: 0 },
    depth: { value: 0 },
    pan: { value: 0 },
    start: jest.fn().mockReturnThis(),
  };
};

const Vibrato = jest.fn(() => createEffectNode());
const Tremolo = jest.fn(() => createEffectNode());
const Panner = jest.fn(() => createEffectNode());

export {
  Gain,
  getDestination,
  Vibrato,
  Tremolo,
  Panner,
};
