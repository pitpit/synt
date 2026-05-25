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

test('emits first step value on first tick at clock 750ms', () => {
  const arp = new Arpeggiator();
  const spy = jest.spyOn(arp, 'pushOutput');

  jest.advanceTimersByTime(750); // default clock = 750 ms

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(
    PlugPosition.WEST,
    expect.objectContaining({ value: 0.3 }),
  );
});

test('advances step on each tick', () => {
  const arp = new Arpeggiator();
  const spy = jest.spyOn(arp, 'pushOutput');

  jest.advanceTimersByTime(1500); // 2 ticks at 750 ms

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

  jest.advanceTimersByTime(750 * 4); // 4 ticks at 750 ms

  expect(arp.stepIndex).toBe(0);
});

test('onSignalChanged maps value 0 to clock 1500ms', () => {
  const arp = new Arpeggiator();
  const input: Signals = [null, new ControlSignal(0), null, null];

  arp.onSignalChanged(input);

  expect(arp.clock).toBe(1500);
});

test('onSignalChanged maps value 1 to clock 150ms', () => {
  const arp = new Arpeggiator();
  const input: Signals = [null, new ControlSignal(1), null, null];

  arp.onSignalChanged(input);

  expect(arp.clock).toBe(0);
});

test('onSignalChanged maps value 0.5 to clock 825ms', () => {
  const arp = new Arpeggiator();
  const input: Signals = [null, new ControlSignal(0.5), null, null];

  arp.onSignalChanged(input);

  expect(arp.clock).toBe(750);
});

test('onSignalChanged restarts timer with new interval', () => {
  const arp = new Arpeggiator();

  // Set clock to max (1500 ms)
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
  const initialClock = arp.clock;
  const input: Signals = [null, null, null, null];

  arp.onSignalChanged(input);

  expect(arp.clock).toBe(initialClock);
});
