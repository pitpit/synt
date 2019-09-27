import Speaker from '../../src/Speaker';
import { Signals } from '../../src/Signal';
import ControlSignal from '../../src/ControlSignal';
import AudioSignal from '../../src/AudioSignal';

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

  const node = { gain: 0 };
  const input: Signals = [new AudioSignal(node), new ControlSignal(1), null, null];
  speaker.onSignalChanged(input);

  expect(node).toStrictEqual({ gain: 0.1 });
});

test('Set and reset gain with ControlSignal', () => {
  const speaker = new Speaker();

  const node = { gain: 0 };
  let input: Signals = [new AudioSignal(node), null, null, null];
  speaker.onSignalChanged(input);
  input = [null, new ControlSignal(1), null, null];
  speaker.onSignalChanged(input);
  input = [null, new ControlSignal(0), null, null];
  speaker.onSignalChanged(input);
  input = [null, new ControlSignal(0.5), null, null];
  speaker.onSignalChanged(input);

  expect(node).toStrictEqual({ gain: 0.05 });
});

test('Gain must be reset on new input mod replacing another', () => {
  const speaker = new Speaker();

  const node1 = { gain: 0 };
  let input: Signals = [new AudioSignal(node1), new ControlSignal(0.5), null, null];
  speaker.onSignalChanged(input);

  expect(node1).toStrictEqual({ gain: 0.05 });

  const node2 = { gain: 0 };
  input = [new AudioSignal(node2), null, null, null];
  speaker.onSignalChanged(input);

  expect(node2).toStrictEqual({ gain: 0.05 });
});
