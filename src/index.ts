import Rack from './Rack';
import Speaker from './Speaker';
import Keyboard from './Keyboard';
import SineOscillator from './SineOscillator';
import SquareOscillator from './SquareOscillator';
import SawtoothOscillator from './SawtoothOscillator';
import TriangleOscillator from './TriangleOscillator';
import Gate from './Gate';
import Knob from './Knob';
import SwitchOn from './SwitchOn';
import Vibrato from './Vibrato';
import Tremolo from './Tremolo';
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
