import Rack from './rack';
import Speaker from './speaker';

const rack = new Rack();
const speaker1 = new Speaker();


const speaker2 = new Speaker(3, 0);
// rack.mods.push(speaker2);
rack.add(speaker1);
rack.add(speaker2);
rack.draw();

// if (module.hot) {
//     module.hot.accept('index.js', function() {
//         console.log('Accepting the updated module!');
//     })
// }
