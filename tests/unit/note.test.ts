import Note from '../../src/note';
import PlugPosition from '../../src/plug-position';
import {Signals , ControlSignal} from '../../src/signal';

test('test process with null Signals', () => {
  const note = new Note();

  const input: Signals = [];
  const output = note.process(input);

  expect(output[PlugPosition.EAST]).toBeInstanceOf(ControlSignal);
});
