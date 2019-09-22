import Mod from '../../src/Mod';
import PlugType from '../../src/PlugType';
import PlugPosition from '../../src/PlugPosition';

test('findEntries: mod with no plugs is not an entry', () => {
  const mod = new Mod();

  expect(mod.findEntries()).toStrictEqual([]);
});

test('findEntries: mod is an entry', () => {
  const mod = new Mod();
  mod.configure('', 1,1, [PlugType.OUT]);

  expect(mod.findEntries()).toStrictEqual([mod]);
});

test('findEntries: mod is not an entry because is has an input plug', () => {
  const mod = new Mod();
  mod.configure('', 1,1, [PlugType.OUT, PlugType.IN]);

  expect(mod.findEntries()).toStrictEqual([]);
});

test('findEntries: linked mod is an entry', () => {
  const mod1 = new Mod();
  mod1.configure('', 1,1, [PlugType.OUT, PlugType.NULL, PlugType.IN]);

  const mod2 = new Mod();
  mod2.configure('', 1,1, [PlugType.OUT]);
  mod2.link(PlugPosition.NORTH, mod1);

  expect(mod1.findEntries()).toStrictEqual([mod2]);
});

test('findEntries: linked mods are entries', () => {
  const mod1 = new Mod();
  mod1.configure('', 1,1, [PlugType.OUT, PlugType.IN, PlugType.IN]);

  const mod2 = new Mod();
  mod2.configure('', 1,1, [PlugType.OUT]);
  mod2.link(PlugPosition.NORTH, mod1);

  const mod3 = new Mod();
  mod3.configure('', 1,1, [PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.OUT]);
  mod3.link(PlugPosition.WEST, mod1);

  expect(mod1.findEntries()).toStrictEqual([mod3, mod2]);
});

test('findEntries: linked mod to linked mod is an entry', () => {
  const mod1 = new Mod();
  mod1.configure('', 1,1, [PlugType.OUT, PlugType.IN, PlugType.IN]);

  const mod2 = new Mod();
  mod2.configure('', 1,1, [PlugType.OUT, PlugType.NULL, PlugType.IN]);
  mod2.link(PlugPosition.NORTH, mod1);

  const mod3 = new Mod();
  mod3.configure('', 1,1, [PlugType.OUT]);
  mod3.link(PlugPosition.NORTH, mod2);

  expect(mod1.findEntries()).toStrictEqual([mod3]);
});

test('isEntry: mod with no plugs is not an entry', () => {
  const mod = new Mod();

  expect(mod.isEntry()).toBeFalsy();
});

test('isEntry: mod with outputs and no input is an entry', () => {
  const mod = new Mod();
  mod.configure('', 1,1, [PlugType.OUT, PlugType.OUT]);

  expect(mod.isEntry()).toBeTruthy();
});

test('isEntry: mod with one input is not an entry', () => {
  const mod = new Mod();
  mod.configure('', 1,1, [PlugType.OUT, PlugType.IN, PlugType.OUT]);

  expect(mod.isEntry()).toBeFalsy();
});
