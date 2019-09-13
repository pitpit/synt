
/**
 * Used to represent one of the fourth plugs of a Mod.
 */
export default class Cardinal {
  static NORTH:number = 0;
  static EAST:number = 1;
  static SOUTH:number = 2;
  static WEST:number = 3;

  static opposite(cardinal:number) {
    if (this.NORTH === cardinal) {
      return this.SOUTH;
    }
    if (this.EAST === cardinal) {
      return this.WEST;
    }
    if (this.SOUTH === cardinal) {
      return this.NORTH;
    }
    if (this.WEST === cardinal) {
      return this.EAST;
    }

    throw new Error('Invalid cardinal value');
  }
}
