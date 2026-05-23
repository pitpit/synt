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
import Vibrato from './effect/Vibrato';
import Tremolo from './effect/Tremolo';
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

rack.draw();

// if (module.hot) {
//     module.hot.accept('index.js', function() {
//         console.log('Accepting the updated module!');
//     })
// }
