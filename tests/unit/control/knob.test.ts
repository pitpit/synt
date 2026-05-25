import Knob from '../../../src/control/Knob';
import ControlSignal from '../../../src/core/ControlSignal';
import PlugPosition from '../../../src/core/PlugPosition';
import Speaker from '../../../src/output/Speaker';

test('recalls previous control signal value on reconnect without animation runtime', () => {
  const speaker = new Speaker();
  const firstKnob = new Knob();
  const secondKnob = new Knob();

  speaker.plug([null, null, null, null]);
  firstKnob.plug([null, null, null, speaker]);
  firstKnob.pushOutput(PlugPosition.WEST, new ControlSignal(0.35));

  secondKnob.plug([null, null, null, speaker]);

  expect(secondKnob.value).toBeCloseTo(0.35);
  expect(secondKnob.pos).toBeCloseTo(secondKnob.range * (2 * 0.35 - 1));
});

test('centers knob on connect when previous control value is unknown', () => {
  const speaker = new Speaker();
  const knob = new Knob();

  speaker.plug([null, null, null, null]);
  knob.pushOutput(PlugPosition.WEST, new ControlSignal(0.9));

  knob.plug([null, null, null, speaker]);

  expect(knob.value).toBeCloseTo(0.5);
  expect(knob.pos).toBeCloseTo(0);
});
