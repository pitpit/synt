import Rack from './core/Rack';
import { importRack } from './core/RackSerializer';
import BurgerMenu from './ui/BurgerMenu';
import './index.scss';

const rack = new Rack();

new BurgerMenu(rack);
// Expose programmatic API (used by e2e tests)
(window as unknown as { synt: { importRack: (yaml: string) => void } }).synt = { importRack: (yaml: string) => { importRack(yaml, rack, { silent: true }); } };

fetch('./demo.synt.yaml')
  .then((res) => {
    if (!res.ok) throw new Error(`Failed to load demo.synt.yaml (${String(res.status)})`);

    return res.text();
  })
  .then((yamlStr) => {
    importRack(yamlStr, rack, { silent: true });
  })
  .catch((err: unknown) => {
    // Fallback: draw an empty rack so the app is still usable
    // eslint-disable-next-line no-console
    console.error('Could not load rack YAML:', err instanceof Error ? err.message : String(err));
    rack.draw();
  });
