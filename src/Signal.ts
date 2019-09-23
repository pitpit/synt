export interface Signal {}

// TODO should we have a class instead to predefine an array of empty Signal
export interface Signals {
  [plugPosition: number]: Signal|null;
}
