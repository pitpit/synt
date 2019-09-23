
/**
 * Used to represent one of the fourth plugs of a Mod.
 */
export default class PlugPosition {
  static NORTH:number = 0;

  static EAST:number = 1;

  static SOUTH:number = 2;

  static WEST:number = 3;

  static opposite(plugPosition:number) {
    if (this.NORTH === plugPosition) {
      return this.SOUTH;
    }
    if (this.EAST === plugPosition) {
      return this.WEST;
    }
    if (this.SOUTH === plugPosition) {
      return this.NORTH;
    }
    if (this.WEST === plugPosition) {
      return this.EAST;
    }

    throw new Error('Invalid plugPosition value');
  }
}
