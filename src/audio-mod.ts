import Mod from './mod';
import Konva from 'konva';
import { Signals } from './signal';
import { AudioContext } from 'standardized-audio-context';

export default class AudioMod extends Mod {
  audioContext: AudioContext|null = null;
}
