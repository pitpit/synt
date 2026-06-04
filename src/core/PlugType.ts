/**
 * Used to represent type of a plug.
 */
const PlugType = {
  IN: Symbol('in'),
  OUT: Symbol('out'),
  NULL: Symbol('null'),
  CTRLIN: Symbol('ctrlin'),
  CTRLOUT: Symbol('ctrlout'),
  CLKIN: Symbol('clkin'),
  CLKOUT: Symbol('clkout'),
};

export default PlugType;
