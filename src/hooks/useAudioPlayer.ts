import { useRef, useEffect } from 'react';
import Sound from 'react-native-sound';

Sound.setCategory('Playback', true);

export type AudioSource = string | number | null;

export type AudioPlayer = {
  play: () => void;
  pause: () => void;
  replace: (source: AudioSource) => void;
  loop: boolean;
};

export function setAudioModeAsync(_options: {
  playsInSilentMode?: boolean;
  interruptionMode?: string;
}): Promise<void> {
  return Promise.resolve();
}

export function useAudioPlayer(_initialSource: AudioSource = null): AudioPlayer {
  const soundRef = useRef<Sound | null>(null);
  const loopRef = useRef(false);
  const pendingPlay = useRef(false);

  useEffect(() => {
    return () => {
      soundRef.current?.release();
    };
  }, []);

  const loadAndPlay = (source: AudioSource, playOnLoad: boolean) => {
    soundRef.current?.stop();
    soundRef.current?.release();
    soundRef.current = null;

    if (source === null) return;

    let sound: Sound;
    if (typeof source === 'number') {
      sound = new Sound(source as unknown as string, (error) => {
        if (error) return;
        sound.setNumberOfLoops(loopRef.current ? -1 : 0);
        if (playOnLoad || pendingPlay.current) {
          sound.play();
          pendingPlay.current = false;
        }
      });
    } else {
      sound = new Sound(source, '', (error) => {
        if (error) return;
        sound.setNumberOfLoops(loopRef.current ? -1 : 0);
        if (playOnLoad || pendingPlay.current) {
          sound.play();
          pendingPlay.current = false;
        }
      });
    }
    soundRef.current = sound;
  };

  const player: AudioPlayer = {
    play() {
      if (soundRef.current) {
        soundRef.current.play();
      } else {
        pendingPlay.current = true;
      }
    },
    pause() {
      soundRef.current?.pause();
      pendingPlay.current = false;
    },
    replace(source: AudioSource) {
      loadAndPlay(source, pendingPlay.current);
    },
    get loop() {
      return loopRef.current;
    },
    set loop(value: boolean) {
      loopRef.current = value;
      soundRef.current?.setNumberOfLoops(value ? -1 : 0);
    },
  };

  return player;
}
