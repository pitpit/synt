import Speaker from '../../../src/output/Speaker';
import Signals from '../../../src/core/Signals';
import ControlSignal from '../../../src/core/ControlSignal';
import { Gain } from 'tone';

beforeEach(() => {
  jest.clearAllMocks();
});

test('onSignalChanged with null Signals', () => {
  const speaker = new Speaker();

  const input: Signals = [];
  const output = speaker.onSignalChanged(input);

  expect(output).toStrictEqual([null, null, null, null]);
});

test('onSignalChanged with array of null Signals', () => {
  const speaker = new Speaker();

  const input: Signals = [null, null, null, null];
  const output = speaker.onSignalChanged(input);

  expect(output).toStrictEqual([null, null, null, null]);
});

test('Set gain to 1 with ControlSignal', () => {
  const speaker = new Speaker();

  const input: Signals = [null, new ControlSignal(1), null, null];
  speaker.onSignalChanged(input);

  const GainMock = Gain as jest.Mock;
  const gainNode = GainMock.mock.results[0].value as { gain: { value: number } };
  expect(gainNode.gain.value).toBe(1);
});

test('Set and reset gain with ControlSignal', () => {
  const speaker = new Speaker();

  speaker.onSignalChanged([null, new ControlSignal(1), null, null]);
  speaker.onSignalChanged([null, new ControlSignal(0), null, null]);
  speaker.onSignalChanged([null, new ControlSignal(0.5), null, null]);

  const GainMock = Gain as jest.Mock;
  const gainNode = GainMock.mock.results[0].value as { gain: { value: number } };
  expect(gainNode.gain.value).toBe(0.5);
});
