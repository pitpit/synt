import Rack from './rack';
import Speaker from './speaker';
// import Note from './note';
import Oscillator from './oscillator';
import Reverb from './reverb';
import Gate from './gate';
import Flanger from './flanger';
import StereoPanner from './stereo-panner';
import Knob from './knob';
import './index.scss';

const rack = new Rack();
const speaker1 = new Speaker();
const speaker2 = new Speaker();
const reverb = new Reverb();
const gate = new Gate();
const flanger = new Flanger();
const panner = new StereoPanner();
const knob1 = new Knob();
// const note1 = new Note(3, 0);

const oscillator1 = new Oscillator();
const oscillator2 = new Oscillator();

rack.add(reverb, 0, 0);
rack.add(gate, 1, 0);
rack.add(oscillator1, 2, 0);
rack.add(speaker1, 3, 0);
rack.add(flanger, 4, 0);
rack.add(panner, 5, 0);
rack.add(oscillator2, 6, 0);
rack.add(speaker2, 7, 0);
rack.add(knob1, 8, 0);
// rack.add(note1);
rack.draw();

// if (module.hot) {
//     module.hot.accept('index.js', function() {
//         console.log('Accepting the updated module!');
//     })
// }
