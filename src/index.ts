import Rack from './rack';
import Speaker from './speaker';
// import Note from './note';
import Oscillator from './oscillator';
import Reverb from './reverb';

const rack = new Rack();
const speaker1 = new Speaker();
const reverb = new Reverb();


// const note1 = new Note(3, 0);
const oscillator = new Oscillator();
// rack.mods.push(speaker2);
rack.add(reverb, 0, 0);
rack.add(oscillator, 1, 1);
rack.add(speaker1, 2, 2);
// rack.add(note1);
rack.draw();

// if (module.hot) {
//     module.hot.accept('index.js', function() {
//         console.log('Accepting the updated module!');
//     })
// }
