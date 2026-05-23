import Speaker from '../../src/Speaker';
import { Signals } from '../../src/Signal';
import ControlSignal from '../../src/ControlSignal';
import AudioSignal from '../../src/AudioSignal';
import type { ugen } from 'gibberish-dsp';
import Gibberish from 'gibberish-dsp';

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

  const node = {} as ugen;
  const input: Signals = [new AudioSignal(node), new ControlSignal(1), null, null];
  speaker.onSignalChanged(input);

  const mulMock = Gibberish.binops.Mul as jest.Mock;
  const gainNode = mulMock.mock.results[0].value as { [key: number]: unknown };
  expect(gainNode[1]).toBe(1);
});

test('Set and reset gain with ControlSignal', () => {
  const speaker = new Speaker();

  const node = {} as ugen;
  let input: Signals = [new AudioSignal(node), null, null, null];
  speaker.onSignalChanged(input);
  input = [null, new ControlSignal(1), null, null];
  speaker.onSignalChanged(input);
  input = [null, new ControlSignal(0), null, null];
  speaker.onSignalChanged(input);
  input = [null, new ControlSignal(0.5), null, null];
  speaker.onSignalChanged(input);

  const mulMock = Gibberish.binops.Mul as jest.Mock;
  const gainNode = mulMock.mock.results[0].value as { [key: number]: unknown };
  expect(gainNode[1]).toBe(0.5);
});

test('Gain must be reset on new input mod replacing another', () => {
  const speaker = new Speaker();

  const node1 = {} as ugen;
  let input: Signals = [new AudioSignal(node1), new ControlSignal(0.5), null, null];
  speaker.onSignalChanged(input);

  const mulMock = Gibberish.binops.Mul as jest.Mock;
  const gainNode1 = mulMock.mock.results[0].value as { [key: number]: unknown };
  expect(gainNode1[1]).toBe(0.5);

  const node2 = {} as ugen;
  input = [new AudioSignal(node2), null, null, null];
  speaker.onSignalChanged(input);

  expect(mulMock).toHaveBeenCalledTimes(2);
  expect(mulMock).toHaveBeenLastCalledWith(node2, 0.5);
});
