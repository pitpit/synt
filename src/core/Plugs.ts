import Plug from './Plug';
import PlugType from './PlugType';

export default class Plugs {
  items: Array<Plug> = [new Plug(), new Plug(), new Plug(), new Plug()];

  untriggeredInput: Array<boolean> = [true, true, true, true];

  /**
   * Get a plug from its position.
   */
  getPlug(plugPosition: number): Plug {
    return this.items[plugPosition];
  }

  /**
   * Configure plugs from a flat clockwise perimeter array of plug types:
   *   NORTH left→right, EAST top→bottom, SOUTH right→left, WEST bottom→top.
   * For a 1×1 mod this is [N, E, S, W] (4 elements).
   * For an M×N mod this is 2*(width+height) elements.
   * The first non-NULL type on each face becomes the canonical plug (indices 0-3)
   * with its slotOffset set. Further non-NULL types on the same face are added
   * via addExtendedPlug().
   */
  setTypes(
    plugTypes: symbol[],
    width: number = 1,
    height: number = 1,
  ): this {
    // Reset to 4 default NULL plugs
    this.items = [new Plug(), new Plug(), new Plug(), new Plug()];
    this.untriggeredInput = [true, true, true, true];

    // Set side for canonical plugs
    for (let s = 0; s < 4; s += 1) {
      this.items[s].side = s;
      this.items[s].type = PlugType.NULL;
    }

    let i = 0;

    // NORTH: left → right (row=0)
    for (let col = 0; col < width; col += 1) {
      const t = plugTypes[i] ?? PlugType.NULL;
      i += 1;
      if (t !== PlugType.NULL) {
        if (this.items[0].type === PlugType.NULL) {
          this.items[0].type = t;
          this.items[0].slotOffset = col;
        } else {
          this.addExtendedPlug(t, 0, col);
        }
      }
    }

    // EAST: top → bottom (col=width-1)
    for (let row = 0; row < height; row += 1) {
      const t = plugTypes[i] ?? PlugType.NULL;
      i += 1;
      if (t !== PlugType.NULL) {
        if (this.items[1].type === PlugType.NULL) {
          this.items[1].type = t;
          this.items[1].slotOffset = row;
        } else {
          this.addExtendedPlug(t, 1, row);
        }
      }
    }

    // SOUTH: right → left (row=height-1)
    for (let col = width - 1; col >= 0; col -= 1) {
      const t = plugTypes[i] ?? PlugType.NULL;
      i += 1;
      if (t !== PlugType.NULL) {
        if (this.items[2].type === PlugType.NULL) {
          this.items[2].type = t;
          this.items[2].slotOffset = col;
        } else {
          this.addExtendedPlug(t, 2, col);
        }
      }
    }

    // WEST: bottom → top (col=0)
    for (let row = height - 1; row >= 0; row -= 1) {
      const t = plugTypes[i] ?? PlugType.NULL;
      i += 1;
      if (t !== PlugType.NULL) {
        if (this.items[3].type === PlugType.NULL) {
          this.items[3].type = t;
          this.items[3].slotOffset = row;
        } else {
          this.addExtendedPlug(t, 3, row);
        }
      }
    }

    return this;
  }

  /**
   * Append an extended plug (index 4+) with explicit side and slotOffset.
   * Returns the index of the new plug.
   */
  addExtendedPlug(type: symbol, side: number, slotOffset: number): number {
    const plug = new Plug();
    plug.type = type;
    plug.side = side;
    plug.slotOffset = slotOffset;
    this.items.push(plug);
    this.untriggeredInput.push(true);
    return this.items.length - 1;
  }

  /**
   * Returns the index of the first plug whose side matches the given value.
   * Returns -1 if none found.
   */
  findFirstBySide(side: number): number {
    return this.items.findIndex((p) => p.side === side);
  }

  /**
   * Iterate over plugs.
   */
  forEach(callback: (plug: Plug, plugPosition: number) => void) {
    this.items.forEach((plug: Plug, plugPosition: number) => {
      callback(plug, plugPosition);
    });
  }

  /**
   * If a plug has several inputs and one of them did not receive
   * an input signal from linked mods, it returns true.
   */
  hasUntriggeredLinkedInput(): boolean {
    return this.items.some((plug: Plug, plugPosition: number) =>
      plug.isInput() && !!plug.mod && this.untriggeredInput[plugPosition]
    );
  }

  /**
   * Reset untriggered linked inputs detection.
   * @see hasUntriggeredLinkedInput()
   */
  resetUntriggeredLinkedInput(): this {
    this.untriggeredInput = Array(this.items.length).fill(true) as boolean[];
    return this;
  }
}
