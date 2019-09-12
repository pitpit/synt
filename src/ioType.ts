/**
 * Used to represent type of an Io plug of a Mod.
 */
export default class IoType {
  static IN:symbol = Symbol('in');
  static OUT:symbol = Symbol('out');
  static NULL:symbol = Symbol('null');
}
