import * as yaml from 'js-yaml';
import tingle from 'tingle.js';
import Rack from './Rack';
import Mod from './Mod';
import StickyNote from '../annotation/StickyNote';
import Speaker from '../output/Speaker';
import Keyboard from '../control/Keyboard';
import SineOscillator from '../oscillator/SineOscillator';
import SquareOscillator from '../oscillator/SquareOscillator';
import SawtoothOscillator from '../oscillator/SawtoothOscillator';
import TriangleOscillator from '../oscillator/TriangleOscillator';
import Gate from '../control/Gate';
import Knob from '../control/Knob';
import SwitchOn from '../control/SwitchOn';
import MidiIn from '../control/MidiIn';
import ControlMeter from '../control/ControlMeter';
import Oscilloscope from '../control/Oscilloscope';
import Chorus from '../effect/Chorus';
import Flanger from '../effect/Flanger';
import Vibrato from '../effect/Vibrato';
import Tremolo from '../effect/Tremolo';
import Panner from '../effect/Panner';
import Phaser from '../effect/Phaser';
import Reverb from '../effect/Reverb';
import HighPassFilter from '../filter/HighPassFilter';
import Clock from '../control/Clock';
import Sequencer from '../control/Sequencer';

// ---------------------------------------------------------------------------
// Mod registry
// ---------------------------------------------------------------------------

type AnyModConstructor = new (...args: never[]) => Mod;

const MOD_REGISTRY: Record<string, AnyModConstructor> = {
  Chorus,
  Clock,
  ControlMeter,
  Flanger,
  Gate,
  HighPassFilter,
  Keyboard,
  Knob,
  MidiIn,
  Oscilloscope,
  Panner,
  Phaser,
  Reverb,
  SawtoothOscillator,
  Sequencer,
  SineOscillator,
  Speaker,
  SquareOscillator,
  SwitchOn,
  Tremolo,
  TriangleOscillator,
  Vibrato,
};

const KNOWN_TYPES = new Set(Object.keys(MOD_REGISTRY));

const REVERSE_REGISTRY = new Map<AnyModConstructor, string>(
  Object.entries(MOD_REGISTRY).map(([name, ctor]) => [ctor, name]),
);

const SCHEMA_PRAGMA = '# yaml-language-server: $schema=https://raw.githubusercontent.com/pitpit/synt/main/synt.schema.json';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface ModSpec {
  type: string;
  x: number;
  y: number;
  value?: number;
}

interface AnnotationSpec {
  x: number;
  y: number;
  text: string;
}

interface RackSpec {
  width?: number;
  height?: number;
}

interface SyntDoc {
  synt: {
    rack?: RackSpec;
    mods: ModSpec[];
    annotations?: AnnotationSpec[];
  };
}

export interface ImportOptions {
  /** Skip the confirmation dialog (e.g. when loading on app startup). */
  silent?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function showError(message: string): void {
  const modal = new tingle.modal({
    footer: true,
    closeMethods: ['overlay', 'escape'],
  });
  modal.addFooterBtn('Close', 'tingle-btn tingle-btn--pull-right', () => {
    modal.close();
  });
  modal.setContent(`<div style="padding:16px">${message}</div>`);
  modal.open();
}

function validateDoc(doc: unknown): string[] {
  const errors: string[] = [];

  if (typeof doc !== 'object' || doc === null || !('synt' in (doc))) {
    return ['Invalid format: missing top-level <code>synt</code> key.'];
  }

  const { synt } = doc as SyntDoc;

  if (!Array.isArray(synt.mods)) {
    return ['Invalid format: <code>synt.mods</code> must be an array.'];
  }

  synt.mods.forEach((mod, i) => {
    if (!mod.type) {
      errors.push(`mods[${String(i)}]: missing <code>type</code>`);
    } else if (!KNOWN_TYPES.has(mod.type)) {
      errors.push(`mods[${String(i)}]: unknown type <code>${mod.type}</code>`);
    }
    if (typeof mod.x !== 'number' || mod.x < 0 || !Number.isInteger(mod.x)) {
      errors.push(`mods[${String(i)}]: <code>x</code> must be a non-negative integer`);
    }
    if (typeof mod.y !== 'number' || mod.y < 0 || !Number.isInteger(mod.y)) {
      errors.push(`mods[${String(i)}]: <code>y</code> must be a non-negative integer`);
    }
    if (mod.value !== undefined && (typeof mod.value !== 'number' || mod.value < 0 || mod.value > 1)) {
      errors.push(`mods[${String(i)}]: <code>value</code> must be a number between 0 and 1`);
    }
  });

  (synt.annotations ?? []).forEach((ann, i) => {
    if (typeof ann.x !== 'number' || ann.x < 0) {
      errors.push(`annotations[${String(i)}]: <code>x</code> must be a non-negative number`);
    }
    if (typeof ann.y !== 'number' || ann.y < 0) {
      errors.push(`annotations[${String(i)}]: <code>y</code> must be a non-negative number`);
    }
  });

  return errors;
}

function instantiateMods(specs: ModSpec[]): { mod: Mod; x: number; y: number }[] {
  return specs
    .filter((spec) => spec.type !== 'StickyNote')
    .map((spec) => {
      const Ctor = MOD_REGISTRY[spec.type];
      const mod = new Ctor();
      if (mod instanceof Knob && spec.value !== undefined) {
        mod.value = Math.max(0, Math.min(1, spec.value));
        mod.pos = mod.range * (2 * mod.value - 1);
      }
      return { mod, x: spec.x, y: spec.y };
    });
}

function instantiateNotes(specs: AnnotationSpec[]): { note: StickyNote; x: number; y: number }[] {
  return specs.map((spec) => ({ note: new StickyNote(spec.text), x: spec.x, y: spec.y }));
}

function detectOverlaps(
  instances: { mod: Mod; x: number; y: number }[],
  specs: ModSpec[],
  rackWidth: number,
  rackHeight: number,
): string[] {
  const errors: string[] = [];

  for (let i = 0; i < instances.length; i++) {
    const { mod: a, x: ax, y: ay } = instances[i];

    if (ax + a.width > rackWidth || ay + a.height > rackHeight) {
      errors.push(
        `mods[${String(i)}] (${specs[i].type} at ${String(ax)},${String(ay)}) extends beyond rack bounds (${String(rackWidth)}×${String(rackHeight)})`,
      );
      continue;
    }

    for (let j = 0; j < i; j++) {
      const { mod: b, x: bx, y: by } = instances[j];
      const overlaps =
        ax < bx + b.width &&
        ax + a.width > bx &&
        ay < by + b.height &&
        ay + a.height > by;
      if (overlaps) {
        errors.push(`mods[${String(i)}] (${specs[i].type}) overlaps with mods[${String(j)}] (${specs[j].type})`);
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function exportRack(rack: Rack): string {
  const mods: ModSpec[] = [];
  const seen = new Set<Mod>();

  rack.mods.forEach((mod) => {
    if (seen.has(mod)) return;
    seen.add(mod);

    const typeName = REVERSE_REGISTRY.get(mod.constructor as AnyModConstructor);
    if (!typeName) return;

    const spec: ModSpec = { type: typeName, x: mod.x, y: mod.y };
    if (mod instanceof Knob) {
      spec.value = mod.value;
    }
    mods.push(spec);
  });

  const annotations: AnnotationSpec[] = rack.annotations.map((annotation) => ({
    x: annotation.pixelX,
    y: annotation.pixelY,
    text: (annotation as StickyNote).text,
  }));

  const doc: SyntDoc = {
    synt: {
      rack: { width: rack.stageWidth, height: rack.stageHeight },
      mods,
      ...(annotations.length > 0 ? { annotations } : {}),
    },
  };

  return `${SCHEMA_PRAGMA}\n${yaml.dump(doc)}`;
}

export function importRack(yamlStr: string, rack: Rack, options: ImportOptions = {}): void {
  // Parse
  let doc: unknown;
  try {
    doc = yaml.load(yamlStr);
  } catch (err) {
    showError(`<p>Could not parse YAML:</p><pre>${(err as Error).message}</pre>`);
    return;
  }

  // Validate structure and known types
  const validationErrors = validateDoc(doc);
  if (validationErrors.length > 0) {
    showError(
      `<p>Validation errors:</p><ul>${validationErrors.map((e) => `<li>${e}</li>`).join('')}</ul>`,
    );
    return;
  }

  const { synt } = doc as SyntDoc;
  const rackWidth = synt.rack?.width ?? 10;
  const rackHeight = synt.rack?.height ?? 10;

  // Instantiate mods to get their actual dimensions for overlap/bounds checking
  const instances = instantiateMods(synt.mods);
  const noteInstances = instantiateNotes(synt.annotations ?? []);
  const overlapErrors = detectOverlaps(instances, synt.mods, rackWidth, rackHeight);
  if (overlapErrors.length > 0) {
    showError(
      `<p>Position errors:</p><ul>${overlapErrors.map((e) => `<li>${e}</li>`).join('')}</ul>`,
    );
    return;
  }

  const doImport = () => {
    rack.clear();
    rack.stageWidth = rackWidth;
    rack.stageHeight = rackHeight;
    instances.forEach(({ mod, x, y }) => rack.add(mod, x, y));
    noteInstances.forEach(({ note, x, y }) => rack.addAnnotation(note, x, y));
    rack.draw();
    rack.plugAll();
  };

  if (options.silent) {
    doImport();
    return;
  }

  const modal = new tingle.modal({
    footer: true,
    closeMethods: ['overlay', 'escape'],
  });
  modal.addFooterBtn(
    'Import',
    'tingle-btn tingle-btn--primary tingle-btn--pull-right',
    () => {
      modal.close();
      doImport();
    },
  );
  modal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--pull-right', () => {
    modal.close();
  });
  modal.setContent(
    '<p style="padding:16px">This will replace the current rack. Continue?</p>',
  );
  modal.open();
}
