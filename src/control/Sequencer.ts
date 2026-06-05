import Konva from 'konva';
import Mod from '../core/Mod';
import PlugType from '../core/PlugType';
import ControlSignal from '../core/ControlSignal';
import type Signals from '../core/Signals';

const NUM_STEPS = 8;

export default class Sequencer extends Mod {
  currentStep: number = 0;

  private lastClockSignal: ControlSignal | null = null;

  constructor() {
    super();
    // Flat clockwise perimeter for a 1×8 module (2*(1+8) = 18 elements):
    //   NORTH (1): clock input
    //   EAST  (8): step CV inputs 0-7, top→bottom
    //   SOUTH (1): unused
    //   WEST  (8): output at row 7 (bottom), then NULLs bottom→top
    this.configure(
      [
        // NORTH (1 slot):
        PlugType.CLKIN,
        // EAST (8 slots, rows 0-7):
        PlugType.CTRLIN, PlugType.CTRLIN, PlugType.CTRLIN, PlugType.CTRLIN,
        PlugType.CTRLIN, PlugType.CTRLIN, PlugType.CTRLIN, PlugType.CTRLIN,
        // SOUTH (1 slot):
        PlugType.NULL,
        // WEST (8 slots, rows 7-0, bottom→top):
        PlugType.CTRLOUT, PlugType.NULL, PlugType.NULL, PlugType.NULL,
        PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.NULL,
      ],
      'seq',
      1,
      NUM_STEPS,
    );
  }

  override onSignalChanged(inputSignals: Signals): Signals {
    // Index 0 = NORTH CLKIN (clock)
    const clockSignal = inputSignals[0];
    if (clockSignal instanceof ControlSignal) {
      if (this.lastClockSignal === null || !clockSignal.eq(this.lastClockSignal)) {
        this.currentStep = (this.currentStep + 1) % NUM_STEPS;
        this.lastClockSignal = clockSignal;
      }
    }

    // Step 0 → canonical EAST plug at index 1; steps 1-7 → extended plugs at indices 4-10
    const stepIndex = this.currentStep === 0 ? 1 : this.currentStep + 3;
    const stepSignal = inputSignals[stepIndex];
    const output: Signals = Array(this.plugs.items.length).fill(null) as Signals;
    if (stepSignal instanceof ControlSignal) {
      // Index 3 = WEST CTRLOUT
      output[3] = stepSignal;
    }
    return output;
  }

  override draw(_group: Konva.Group): void {
  }

}
