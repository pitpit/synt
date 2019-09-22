import Rack from './rack';
import Speaker from './speaker';
import Oscillator from './oscillator';
import Gate from './gate';
import StereoPanner from './stereo-panner';
import Gain from './gain';
import Knob from './knob';
import SwitchOn from './switch-on';
import './index.scss';

const rack = new Rack();
const speaker1 = new Speaker();
const speaker2 = new Speaker();
const gate = new Gate();
const panner1 = new StereoPanner();
const panner2 = new StereoPanner();
const knob1 = new Knob();
const knob2 = new Knob();
const gain = new Gain();
const switchOn1 = new SwitchOn();

const oscillator1 = new Oscillator();
const oscillator2 = new Oscillator();

rack.add(gate, 1, 0);
rack.add(oscillator1, 2, 0);
rack.add(speaker1, 3, 0);
rack.add(panner1, 5, 0);
rack.add(panner2, 0, 1);
rack.add(oscillator2, 6, 0);
rack.add(speaker2, 7, 0);
rack.add(knob1, 8, 0);
rack.add(knob2, 9, 0);
rack.add(gain, 1, 1);
rack.add(switchOn1, 3, 3);
rack.draw();

// if (module.hot) {
//     module.hot.accept('index.js', function() {
//         console.log('Accepting the updated module!');
//     })
// }
