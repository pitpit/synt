import Speaker from '../../../src/output/Speaker';
import Signals from '../../../src/core/Signals';
import ControlSignal from '../../../src/core/ControlSignal';
import AudioSignal from '../../../src/core/AudioSignal';
import type { ToneAudioNode } from 'tone';
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

  const node = { connect: jest.fn(), disconnect: jest.fn() } as unknown as ToneAudioNode;
  const input: Signals = [new AudioSignal(node), new ControlSignal(1), null, null];
  speaker.onSignalChanged(input);

  const GainMock = Gain as jest.Mock;
  const gainNode = GainMock.mock.results[0].value as { gain: { value: number } };
  expect(gainNode.gain.value).toBe(1);
});

test('Set and reset gain with ControlSignal', () => {
  const speaker = new Speaker();

  const node = { connect: jest.fn(), disconnect: jest.fn() } as unknown as ToneAudioNode;
  let input: Signals = [new AudioSignal(node), null, null, null];
  speaker.onSignalChanged(input);
  input = [null, new ControlSignal(1), null, null];
  speaker.onSignalChanged(input);
  input = [null, new ControlSignal(0), null, null];
  speaker.onSignalChanged(input);
  input = [null, new ControlSignal(0.5), null, null];
  speaker.onSignalChanged(input);

  const GainMock = Gain as jest.Mock;
  const gainNode = GainMock.mock.results[0].value as { gain: { value: number } };
  expect(gainNode.gain.value).toBe(0.5);
});

test('Gain must be reset on new input mod replacing another', () => {
  const speaker = new Speaker();

  const node1 = { connect: jest.fn(), disconnect: jest.fn() } as unknown as ToneAudioNode;
  let input: Signals = [new AudioSignal(node1), new ControlSignal(0.5), null, null];
  speaker.onSignalChanged(input);

  const GainMock = Gain as jest.Mock;
  const gainNode1 = GainMock.mock.results[0].value as { gain: { value: number } };
  expect(gainNode1.gain.value).toBe(0.5);

  const node2 = { connect: jest.fn(), disconnect: jest.fn() } as unknown as ToneAudioNode;
  input = [new AudioSignal(node2), null, null, null];
  speaker.onSignalChanged(input);

  expect(GainMock).toHaveBeenCalledTimes(2);
  expect(GainMock).toHaveBeenLastCalledWith(0.5);
});
