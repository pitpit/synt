import Arpeggiator from '../../../src/control/Arpeggiator';
import Signals from '../../../src/core/Signals';
import ControlSignal from '../../../src/core/ControlSignal';
import PlugPosition from '../../../src/core/PlugPosition';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('emits first step value on first tick at 120 BPM', () => {
  const arp = new Arpeggiator();
  const spy = jest.spyOn(arp, 'pushOutput');

  jest.advanceTimersByTime(500); // 120 BPM = 500 ms per beat

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(
    PlugPosition.WEST,
    expect.objectContaining({ value: 0.3 }),
  );
});

test('advances step on each tick', () => {
  const arp = new Arpeggiator();
  const spy = jest.spyOn(arp, 'pushOutput');

  jest.advanceTimersByTime(1000); // 2 ticks at 120 BPM

  expect(spy).toHaveBeenCalledTimes(2);
  expect(spy).toHaveBeenNthCalledWith(
    1,
    PlugPosition.WEST,
    expect.objectContaining({ value: 0.3 }),
  );
  expect(spy).toHaveBeenNthCalledWith(
    2,
    PlugPosition.WEST,
    expect.objectContaining({ value: 0.45 }),
  );
});

test('step index wraps back to 0 after 4 steps', () => {
  const arp = new Arpeggiator();

  jest.advanceTimersByTime(500 * 4); // 4 ticks at 120 BPM

  expect(arp.stepIndex).toBe(0);
});

test('onSignalChanged maps value 0 to bpm 40', () => {
  const arp = new Arpeggiator();
  const input: Signals = [null, new ControlSignal(0), null, null];

  arp.onSignalChanged(input);

  expect(arp.bpm).toBe(40);
});

test('onSignalChanged maps value 1 to bpm 200', () => {
  const arp = new Arpeggiator();
  const input: Signals = [null, new ControlSignal(1), null, null];

  arp.onSignalChanged(input);

  expect(arp.bpm).toBe(200);
});

test('onSignalChanged maps value 0.5 to bpm 120', () => {
  const arp = new Arpeggiator();
  const input: Signals = [null, new ControlSignal(0.5), null, null];

  arp.onSignalChanged(input);

  expect(arp.bpm).toBe(120);
});

test('onSignalChanged restarts timer with new interval', () => {
  const arp = new Arpeggiator();

  // Slow down to 40 BPM (1500 ms per beat)
  const input: Signals = [null, new ControlSignal(0), null, null];
  arp.onSignalChanged(input);

  const spy = jest.spyOn(arp, 'pushOutput');

  jest.advanceTimersByTime(1000); // below 1500 ms threshold
  expect(spy).toHaveBeenCalledTimes(0);

  jest.advanceTimersByTime(500); // reaches 1500 ms
  expect(spy).toHaveBeenCalledTimes(1);
});

test('onSignalChanged returns null for all outputs', () => {
  const arp = new Arpeggiator();
  const input: Signals = [null, new ControlSignal(0.5), null, null];

  const output = arp.onSignalChanged(input);

  expect(output).toStrictEqual([null, null, null, null]);
});

test('non-ControlSignal on EAST is ignored', () => {
  const arp = new Arpeggiator();
  const initialBpm = arp.bpm;
  const input: Signals = [null, null, null, null];

  arp.onSignalChanged(input);

  expect(arp.bpm).toBe(initialBpm);
});
