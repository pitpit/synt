import TestMod from './TestMod';
import PlugType from '../../src/PlugType';
import PlugPosition from '../../src/PlugPosition';


test('findEntries: mod with no plugs is not an entry', () => {
  const mod = new TestMod();

  expect(mod.findEntries()).toStrictEqual([]);
});

test('findEntries: mod is an entry', () => {
  const mod = new TestMod();
  mod.configure([PlugType.OUT]);

  expect(mod.findEntries()).toStrictEqual([mod]);
});

test('findEntries: mod is not an entry because is has an input plug', () => {
  const mod = new TestMod();
  mod.configure([PlugType.OUT, PlugType.IN]);

  expect(mod.findEntries()).toStrictEqual([]);
});

test('findEntries: linked mod is an entry', () => {
  const mod1 = new TestMod();
  mod1.configure([PlugType.OUT, PlugType.NULL, PlugType.IN]);

  const mod2 = new TestMod();
  mod2.configure([PlugType.OUT]);
  mod2.link(PlugPosition.NORTH, mod1);

  expect(mod1.findEntries()).toStrictEqual([mod2]);
});

test('findEntries: linked mods are entries', () => {
  const mod1 = new TestMod();
  mod1.configure([PlugType.OUT, PlugType.IN, PlugType.IN]);

  const mod2 = new TestMod();
  mod2.configure([PlugType.OUT]);
  mod2.link(PlugPosition.NORTH, mod1);

  const mod3 = new TestMod();
  mod3.configure([PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.OUT]);
  mod3.link(PlugPosition.WEST, mod1);

  expect(mod1.findEntries()).toStrictEqual([mod3, mod2]);
});

test('findEntries: linked mod to linked mod is an entry', () => {
  const mod1 = new TestMod();
  mod1.configure([PlugType.OUT, PlugType.IN, PlugType.IN]);

  const mod2 = new TestMod();
  mod2.configure([PlugType.OUT, PlugType.NULL, PlugType.IN]);
  mod2.link(PlugPosition.NORTH, mod1);

  const mod3 = new TestMod();
  mod3.configure([PlugType.OUT]);
  mod3.link(PlugPosition.NORTH, mod2);

  expect(mod1.findEntries()).toStrictEqual([mod3]);
});

test('isEntry: mod with no plugs is not an entry', () => {
  const mod = new TestMod();

  expect(mod.isEntry()).toBeFalsy();
});

test('isEntry: mod with outputs and no input is an entry', () => {
  const mod = new TestMod();
  mod.configure([PlugType.OUT, PlugType.OUT]);

  expect(mod.isEntry()).toBeTruthy();
});

test('isEntry: mod with one input is not an entry', () => {
  const mod = new TestMod();
  mod.configure([PlugType.OUT, PlugType.IN, PlugType.OUT]);

  expect(mod.isEntry()).toBeFalsy();
});

test('link: link to another mod', () => {
  const mod1 = new TestMod();
  const mod2 = new TestMod();
  mod1.link(PlugPosition.NORTH, mod2);

  expect(mod1.plugs.getPlug(PlugPosition.NORTH).mod).toStrictEqual(mod2);
  expect(mod2.plugs.getPlug(PlugPosition.SOUTH).mod).toStrictEqual(mod1);
});

test('link: link to another mod replace already linked mod', () => {
  const mod1 = new TestMod();
  const mod2 = new TestMod();
  const mod3 = new TestMod();
  mod1.link(PlugPosition.NORTH, mod2);
  mod1.link(PlugPosition.NORTH, mod3);

  expect(mod1.plugs.getPlug(PlugPosition.NORTH).mod).toStrictEqual(mod3);
  expect(mod2.plugs.getPlug(PlugPosition.SOUTH).mod).toBeNull();
  expect(mod3.plugs.getPlug(PlugPosition.SOUTH).mod).toStrictEqual(mod1);
});

test('unlink', () => {
  const mod1 = new TestMod();
  const mod2 = new TestMod();
  mod1.link(PlugPosition.NORTH, mod2);
  mod1.unlink(PlugPosition.NORTH);

  expect(mod1.plugs.getPlug(PlugPosition.NORTH).mod).toBeNull();
  expect(mod2.plugs.getPlug(PlugPosition.SOUTH).mod).toBeNull();
});
