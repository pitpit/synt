import { AudioContext, OscillatorNode } from 'standardized-audio-context';
import Oscillator from '../../src/oscillator';
import Speaker from '../../src/speaker';

jest.mock('standardized-audio-context');

// beforeEach(() => {
//   AudioContext.mockClear();
// });

test('1 oscillator <- 1 speaker', () => {

  const audioContext = new AudioContext();
  const oscillatorNode = new OscillatorNode(audioContext);
  // const audioParam = new AudioParam();

  const audioContextMock = AudioContext.mock.instances[0];
  const oscillatorNodeMock = OscillatorNode.mock.instances[0];
  audioContextMock.createOscillator.mockResolvedValue(oscillatorNode);
  oscillatorNodeMock.get.mockResolvedValue({});

  // oscillatorMock.frequency.mockResolvedValue(new AudioParam());

  // jest.spyOn(audioContext, 'frequency', 'get').mockReturnValue(new AudioParam());
  // audioContextMock.frequency.mockReturnValue(new AudioParam());

  const oscillator = new Oscillator().setAudioContext(audioContextMock);
  const speaker = new Speaker().setAudioContext(audioContextMock);

  oscillator.linkAll([null, null, speaker,null]);

  // expect(speaker.gain).not.toBeNull();
  // expect(speaker.gain.gain.value).toBe(1);


  expect(audioContextMock.connect).toHaveBeenCalledTimes(1);
});
