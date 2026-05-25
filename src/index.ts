import Rack from './core/Rack';
import { importRack } from './core/RackSerializer';
import BurgerMenu from './ui/BurgerMenu';
import './index.scss';

const rack = new Rack();
// eslint-disable-next-line no-new
new BurgerMenu(rack);
// Expose programmatic API (used by e2e tests)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).synt = { importRack: (yaml: string) => importRack(yaml, rack, { silent: true }) };

fetch('/demo.synt.yaml')
  .then((res) => {
    if (!res.ok) throw new Error(`Failed to load demo.synt.yaml (${res.status})`);
    return res.text();
  })
  .then((yamlStr) => {
    importRack(yamlStr, rack, { silent: true });
  })
  .catch((err: Error) => {
    // Fallback: draw an empty rack so the app is still usable
    // eslint-disable-next-line no-console
    console.error('Could not load rack YAML:', err.message);
    rack.draw();
  });
