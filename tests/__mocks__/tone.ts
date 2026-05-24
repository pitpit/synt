const createGainNode = () => ({
  gain: { value: 0.5 },
  connect: jest.fn(),
  disconnect: jest.fn(),
  dispose: jest.fn(),
});

const Gain = jest.fn(() => createGainNode());

const getDestination = jest.fn(() => ({}));

export { Gain, getDestination };
