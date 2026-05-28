import type { ToneAudioNode } from 'tone';

export interface HasAudioOutput {
  readonly audioOutputNode: ToneAudioNode;
}

export interface HasAudioInput {
  readonly audioInputNode: ToneAudioNode;
}

export function hasAudioOutput(m: unknown): m is HasAudioOutput {
  return (m as HasAudioOutput).audioOutputNode instanceof Object;
}

export function hasAudioInput(m: unknown): m is HasAudioInput {
  return (m as HasAudioInput).audioInputNode instanceof Object;
}
