/**
 * Used to represent one of the fourth plugs of a Mod.
 */
const PlugPosition = {
  NORTH: 0,
  EAST: 1,
  SOUTH: 2,
  WEST: 3,
  opposite(plugPosition: number): number {
    if (PlugPosition.NORTH === plugPosition) {
      return PlugPosition.SOUTH;
    }
    if (PlugPosition.EAST === plugPosition) {
      return PlugPosition.WEST;
    }
    if (PlugPosition.SOUTH === plugPosition) {
      return PlugPosition.NORTH;
    }
    if (PlugPosition.WEST === plugPosition) {
      return PlugPosition.EAST;
    }

    throw new Error('Invalid plugPosition value');
  },
};

export default PlugPosition;
