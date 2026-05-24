import Rack from './core/Rack';
import Speaker from './output/Speaker';
import Keyboard from './control/Keyboard';
import SineOscillator from './oscillator/SineOscillator';
import SquareOscillator from './oscillator/SquareOscillator';
import SawtoothOscillator from './oscillator/SawtoothOscillator';
import TriangleOscillator from './oscillator/TriangleOscillator';
import Gate from './control/Gate';
import Knob from './control/Knob';
import SwitchOn from './control/SwitchOn';
import Arpeggiator from './control/Arpeggiator';
import Vibrato from './effect/Vibrato';
import Tremolo from './effect/Tremolo';
import Panner from './effect/Panner';
import StickyNote from './core/StickyNote';
import './index.scss';

const rack = new Rack();

rack.add(new SineOscillator(), 0, 0);
rack.add(new SquareOscillator(), 1, 0);
rack.add(new SawtoothOscillator(), 2, 0);
rack.add(new TriangleOscillator(), 3, 0);
rack.add(new TriangleOscillator(), 4, 0);

rack.add(new Gate(), 0, 1);
rack.add(new Vibrato(), 1, 1);
rack.add(new Tremolo(), 2, 1);
rack.add(new Arpeggiator(), 3, 1);
rack.add(new Panner(), 4, 1);

rack.add(new Knob(), 0, 2);
rack.add(new Knob(), 1, 2);
rack.add(new Knob(), 2, 2);
rack.add(new Knob(), 3, 2);

rack.add(new SwitchOn(), 0, 3);
rack.add(new SwitchOn(), 1, 3);
rack.add(new SwitchOn(), 2, 3);
rack.add(new SwitchOn(), 3, 3);

rack.add(new Speaker(), 0, 4);
rack.add(new Speaker(), 1, 4);
rack.add(new Speaker(), 2, 4);
rack.add(new Speaker(), 3, 4);
rack.add(new Keyboard(), 0, 5);
const note = `Welcome to the modular synthesizer!

Connect modules by dragging from an output plug to an input plug. The top row contains oscillators (Sine, Square, Sawtooth, Triangle) that generate audio signals. Use the Gate to control when sound plays, and Vibrato/Tremolo for pitch and volume modulation.

Arpeggiator (arp) cycles through notes automatically — connect an Oscillator to arpeggiate chords. Panner (pan) pans the audio left/right — connect a Knob to its EAST plug and turn it to sweep the stereo field.

Knobs adjust parameters — drag up/down to change values. SwitchOn modules toggle signals on or off. Speakers output the final audio signal.

Double-click any module to open its settings. Double-click this note to edit it.`;
rack.add(new StickyNote(note), 5, 0);

rack.draw();

// if (module.hot) {
//     module.hot.accept('index.js', function() {
//         console.log('Accepting the updated module!');
//     })
// }
