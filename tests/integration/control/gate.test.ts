import Gate from '../../../src/control/Gate';
import TestOscillator from '../oscillator/TestOscillator';

test('1 oscillator + 1 gate', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();

  oscillator.plug([null, null, null, null]);
  gate.plug([oscillator, null, null, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(gate.audioInputNode);
});

test('1 gate + 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();

  gate.plug([null, null, null, null]);
  oscillator.plug([null, null, gate, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(gate.audioInputNode);
});

test('1 oscillator + 1 gate - 1 gate', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();

  oscillator.plug([null, null, null, null]);
  gate.plug([oscillator, null, null, null]);

  const gateNode = gate.audioInputNode;
  gate.snatch();

  expect(oscillator.node?.disconnect).toHaveBeenCalledWith(gateNode);
  expect(gateNode.dispose).toHaveBeenCalledTimes(1);
});

test('1 oscillator + 1 gate - 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();

  oscillator.plug([null, null, null, null]);
  gate.plug([oscillator, null, null, null]);

  const oscNode = oscillator.node;
  const gateNode = gate.audioInputNode;
  oscillator.snatch();

  expect(oscNode?.disconnect).toHaveBeenCalledWith(gateNode);
});
