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
import './index.scss';

const rack = new Rack();

rack.add(new SineOscillator(), 1, 0);
rack.add(new SquareOscillator(), 2, 0);
rack.add(new SawtoothOscillator(), 3, 0);
rack.add(new TriangleOscillator(), 4, 0);
rack.add(new TriangleOscillator(), 5, 0);

rack.add(new Gate(), 1, 1);

rack.add(new Knob(), 1, 2);
rack.add(new Knob(), 2, 2);
rack.add(new Knob(), 3, 2);
rack.add(new Knob(), 4, 2);

rack.add(new SwitchOn(), 1, 3);
rack.add(new SwitchOn(), 2, 3);
rack.add(new SwitchOn(), 3, 3);
rack.add(new SwitchOn(), 4, 3);

rack.add(new Speaker(), 1, 4);
rack.add(new Speaker(), 2, 4);
rack.add(new Speaker(), 3, 4);
rack.add(new Speaker(), 4, 4);
rack.add(new Keyboard(), 1, 5);

rack.draw();

// if (module.hot) {
//     module.hot.accept('index.js', function() {
//         console.log('Accepting the updated module!');
//     })
// }
