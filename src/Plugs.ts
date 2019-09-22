import PlugPosition from './PlugPosition';
import PlugType from './PlugType';
import Plug from './plug';
import Mod from './Mod';

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
  setTypes(plugTypes: Array<Symbol>): Plugs {
    this.items.forEach((plug, plugPosition) => {
      plug.type = plugTypes[plugPosition];
    });
    return this;
  }

  /**
   * Iterate over plugs.
   */
  forEach(callback: Function) {
    this.items.forEach((plug: Plug, plugPosition: number) => {
      callback(plug, plugPosition);
    });
  }

  /**
   * If a plus has several inputs and one of them did not received
   * an input signal from linked mods, it returns true.
   */
  hasUntriggeredLinkedInput(): boolean {
    let untriggered = false;

    const breakMe: object = {};
    try {
      this.items.forEach((plug: Plug, plugPosition: number) => {
        if (
          plug.isInput()
          && plug.mod
          && this.untriggeredInput[plugPosition]
        ) {
          untriggered = true;
          throw breakMe;
        }
      });
    } catch (e) {
      if (e !== breakMe) throw e;
    }

    return untriggered;
  }

  /**
   * Reset untriggered linked inputs detection.
   * @see hasUntriggeredLinkedInput()
   */
  resetUntriggeredLinkedInput(): Plugs {
    this.untriggeredInput = [true, true, true, true];

    return this;
  }
}
