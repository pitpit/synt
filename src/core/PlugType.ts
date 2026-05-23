/**
 * Used to represent type of a plug.
 */
const PlugType = {
  IN: Symbol('in'),
  OUT: Symbol('out'),
  NULL: Symbol('null'),
  CTRLIN: Symbol('ctrlin'),
  CTRLOUT: Symbol('ctrlout'),
};

export default PlugType;
