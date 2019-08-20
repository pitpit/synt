import rack from './rack';
import Mod from './mod';
const mod1 = new Mod();
rack.addMod(mod1);
rack.draw();


// if (module.hot) {
//     module.hot.accept('index.js', function() {
//         console.log('Accepting the updated module!');
//     })
// }
