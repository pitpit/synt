/**
 * @readonly
 * @enum {{name: string, hex: string}}
 */
const IO = Object.freeze({
  IN:   Symbol('in'),
  OUT:  Symbol('out'),
  NULL: Symbol('null'),
});

export default IO;
