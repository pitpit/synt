import { AudioContext } from 'standardized-audio-context';
import Mod from './Mod';

export default class AudioMod extends Mod {
  audioContext: AudioContext|null = null;
}
