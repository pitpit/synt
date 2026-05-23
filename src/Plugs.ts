import Plug from './Plug';

export default class Plugs {
  items:Array<Plug> = [new Plug(), new Plug(), new Plug(), new Plug()];

  untriggeredInput: Array<boolean> = [true, true, true, true];

  /**
   * Get a plug from its position.
   */
  getPlug(plugPosition: number): Plug {
    return this.items[plugPosition];
  }

  /**
   * Set type of every plugs.
   */
  setTypes(plugTypes: Array<symbol>): this {
    this.items.forEach((plug, plugPosition) => {
      plug.type = plugTypes[plugPosition];
    });
    return this;
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
   * If a plus has several inputs and one of them did not received
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
    this.untriggeredInput = [true, true, true, true];

    return this;
  }
}
