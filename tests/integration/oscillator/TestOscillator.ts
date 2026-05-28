import { Oscillator as ToneOscillator } from 'tone';
import Oscillator from '../../../src/oscillator/Oscillator';

const makeStubNode = () => ({
  sound: 666,
  frequency: { value: 0 },
  connect: jest.fn(),
  disconnect: jest.fn(),
  dispose: jest.fn(),
}) as unknown as ToneOscillator;

export default class TestOscillator extends Oscillator {
  protected createOutputNode(): ToneOscillator {
    return makeStubNode();
  }
}
