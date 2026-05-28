import Speaker from '../../../src/output/Speaker';
import HighPassFilter from '../../../src/filter/HighPassFilter';
import TestOscillator from '../oscillator/TestOscillator';

test('1 oscillator + 1 high-pass filter + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const filter = new HighPassFilter();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  filter.plug([oscillator, null, null, null]);
  speaker.plug([filter, null, null, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(filter.node);
  expect(filter.node?.connect).toHaveBeenCalledWith(speaker.audioInputNode);
});

test('1 oscillator + 1 high-pass filter + 1 speaker - snatch filter does not throw', () => {
  const oscillator = new TestOscillator();
  const filter = new HighPassFilter();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  filter.plug([oscillator, null, null, null]);
  speaker.plug([filter, null, null, null]);

  expect(() => { filter.snatch(); }).not.toThrow();
});

test('1 oscillator + 1 high-pass filter + 1 speaker - snatch filter disconnects', () => {
  const oscillator = new TestOscillator();
  const filter = new HighPassFilter();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  filter.plug([oscillator, null, null, null]);
  speaker.plug([filter, null, null, null]);

  const filterNode = filter.node;
  const speakerGain = speaker.audioInputNode;
  filter.snatch();

  expect(oscillator.node?.disconnect).toHaveBeenCalledWith(filterNode);
  expect(filterNode?.disconnect).toHaveBeenCalledWith(speakerGain);
  expect(filterNode?.dispose).toHaveBeenCalledTimes(1);
});

test('1 oscillator + 1 high-pass filter + 1 speaker - snatch oscillator does not throw', () => {
  const oscillator = new TestOscillator();
  const filter = new HighPassFilter();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  filter.plug([oscillator, null, null, null]);
  speaker.plug([filter, null, null, null]);

  const oscNode = oscillator.node;
  const filterNode = filter.node;

  expect(() => { oscillator.snatch(); }).not.toThrow();
  expect(oscNode?.disconnect).toHaveBeenCalledWith(filterNode);
});

