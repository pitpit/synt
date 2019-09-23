/**
 * Used to represent type of a plug.
 */
export default class PlugType {
  static IN:symbol = Symbol('in');

  static OUT:symbol = Symbol('out');

  static NULL:symbol = Symbol('null');

  static CTRLIN:symbol = Symbol('ctrlin');

  static CTRLOUT:symbol = Symbol('ctrlout');
}
