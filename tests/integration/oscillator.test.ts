import { AudioContext } from 'standardized-audio-context-mock';
import Oscillator from '../../src/oscillator';
import Speaker from '../../src/speaker';

test('1 oscillator + 1 speaker', () => {
  const audioContext: AudioContext = new AudioContext();
  const oscillator = new Oscillator().setAudioContext(audioContext).setPosition(0, 0);
  const speaker = new Speaker().setAudioContext(audioContext).setPosition(0, 1);

  expect(speaker.gain).not.toBeNull();
  expect(speaker.gain.gain.value).toBe(1);
});
