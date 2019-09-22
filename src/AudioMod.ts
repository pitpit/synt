import Mod from './Mod';
import { AudioContext } from 'standardized-audio-context';

export default class AudioMod extends Mod {
  audioContext: AudioContext|null = null;
}
