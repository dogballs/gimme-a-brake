export type SoundMap = {
  [key: string]: HTMLAudioElement;
};

export async function loadSounds() {
  return {
    menu1: await loadSound('data/audio/menu1.mp3'),
    menu2: await loadSound('data/audio/menu2.mp3'),
  };
}

async function loadSound(audioPath: string) {
  return new Promise<HTMLAudioElement>((resolve) => {
    const audio = new Audio();
    audio.src = audioPath;
    audio.addEventListener('loadeddata', () => {
      resolve(audio);
    });
  });
}

export class SoundController {
  sounds: SoundMap = {};

  play(name: string) {
    this.sounds[name].play();
  }
}
