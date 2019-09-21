import Gate from '../../src/gate';
import {Signals , ControlSignal} from '../../src/signal';

test('test process with null Signals', () => {
  const gate = new Gate();

  const input: Signals = [];
  const output = gate._process(input);

  expect(output).toStrictEqual([null, null, null, null]);
});

test('test process with array of null Signals', () => {
  const gate = new Gate();

  const input: Signals = [null, null, null, null];
  const output = gate._process(input);

  expect(output).toStrictEqual([null, null, null, null]);
});

test('test process with ControlSignal on North plug', () => {
  const gate = new Gate();
  const signal = new ControlSignal(() => {});
  const input: Signals = [signal, null, null, null];
  const output = gate._process(input);

  expect(output).toStrictEqual([null, null, signal, null]);
});
