import Rack from './rack';
import Mod from './mod';
const rack = new Rack();
const mod1 = new Mod();
rack.mods.push(mod1);
rack.draw();


// if (module.hot) {
//     module.hot.accept('index.js', function() {
//         console.log('Accepting the updated module!');
//     })
// }
