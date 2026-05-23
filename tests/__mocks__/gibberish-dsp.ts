const createMulNode = (): { connect: jest.Mock; disconnect: jest.Mock; [key: number]: unknown } => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
});

const Gibberish = {
  binops: {
    Mul: jest.fn(() => createMulNode()),
  },
};

export default Gibberish;
