import Rack from './rack';
import Speaker from './speaker';
import Note from './note';

const rack = new Rack();
const speaker1 = new Speaker();


const note1 = new Note(3, 0);
// rack.mods.push(speaker2);
rack.add(speaker1);
rack.add(note1);
rack.draw();

// if (module.hot) {
//     module.hot.accept('index.js', function() {
//         console.log('Accepting the updated module!');
//     })
// }
