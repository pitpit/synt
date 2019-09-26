import Speaker from '../../src/Speaker';
import AudioSignal from '../../src/AudioSignal';
import TestOscillator from './TestOscillator';
import Gate from '../../src/Gate';

test('1 oscillator + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'onSignalChanged');

  oscillator.plug([null, null, null, null]);
  speaker.plug([oscillator, null, null, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith([new AudioSignal(oscillator.node), null, null, null]);
  expect(spy).toHaveReturnedTimes(1);
  expect(spy).toHaveReturnedWith([null, null, null, null]);

  spy.mockRestore();
});

test('1 speaker + 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'onSignalChanged');

  speaker.plug([null, null, null, null]);
  oscillator.plug([null, null, speaker, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith([new AudioSignal(oscillator.node), null, null, null]);
  expect(spy).toHaveReturnedTimes(1);
  expect(spy).toHaveReturnedWith([null, null, null, null]);

  spy.mockRestore();
});

test('1 oscillator + 1 speaker - 1 speaker', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'onSignalBroken');

  oscillator.plug([null, null, null, null]);
  speaker.plug([oscillator, null, null, null]);
  speaker.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(0, new AudioSignal(oscillator.node));

  spy.mockRestore();
});

test('1 oscillator + 1 speaker - 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'onSignalBroken');

  oscillator.plug([null, null, null, null]);
  speaker.plug([oscillator, null, null, null]);
  oscillator.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(0, new AudioSignal(oscillator.node));

  spy.mockRestore();
});

test('1 oscillator + 1 gate + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'onSignalChanged');

  oscillator.plug([null, null, null, null]);
  gate.plug([oscillator, null, null, null]);
  speaker.plug([gate, null, null, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith([new AudioSignal(oscillator.node), null, null, null]);
  expect(spy).toHaveReturnedTimes(1);
  expect(spy).toHaveReturnedWith([null, null, null, null]);

  spy.mockRestore();
});


test('1 oscillator + 1 speaker + 1 gate', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'onSignalChanged');

  oscillator.plug([null, null, null, null]);
  speaker.plug([gate, null, null, null]);
  gate.plug([oscillator, null, speaker, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith([new AudioSignal(oscillator.node), null, null, null]);
  expect(spy).toHaveReturnedTimes(1);
  expect(spy).toHaveReturnedWith([null, null, null, null]);

  spy.mockRestore();
});

test('1 speaker + 1 gate + 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'onSignalChanged');

  speaker.plug([null, null, null, null]);
  gate.plug([null, null, speaker, null]);
  oscillator.plug([null, null, gate, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith([new AudioSignal(oscillator.node), null, null, null]);
  expect(spy).toHaveReturnedTimes(1);
  expect(spy).toHaveReturnedWith([null, null, null, null]);

  spy.mockRestore();
});

test('1 speaker + 1 gate + 1 oscillator - 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'onSignalBroken');

  speaker.plug([null, null, null, null]);
  gate.plug([null, null, speaker, null]);
  oscillator.plug([null, null, gate, null]);
  oscillator.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(0, new AudioSignal(oscillator.node));

  spy.mockRestore();
});

test('1 speaker + 1 gate + 1 oscillator - 1 gate', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'onSignalBroken');

  speaker.plug([null, null, null, null]);
  gate.plug([null, null, speaker, null]);
  oscillator.plug([null, null, gate, null]);
  gate.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(0, new AudioSignal(oscillator.node));

  spy.mockRestore();
});

test('1 speaker + 1 gate + 1 oscillator - 1 speaker', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'onSignalBroken');

  speaker.plug([null, null, null, null]);
  gate.plug([null, null, speaker, null]);
  oscillator.plug([null, null, gate, null]);
  speaker.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(0, new AudioSignal(oscillator.node));

  spy.mockRestore();
});
