export type SoundMap = {
  [key: string]: Sound;
};

export async function loadSounds() {
  return {
    menu1: await loadSound('data/audio/menu1.mp3'),
    menu2: await loadSound('data/audio/menu2.mp3'),
    theme1: await loadSound('data/audio/theme1.mp3'),
  };
}

async function loadSound(audioPath: string) {
  return new Promise<Sound>((resolve) => {
    const audioElement = new Audio();

    const sound = new Sound(audioElement);

    audioElement.src = audioPath;
    audioElement.addEventListener('loadeddata', () => {
      resolve(sound);
    });
  });
}

export class SoundController {
  sounds: SoundMap = {};
  private globalMuted = false;

  play(name: string) {
    this.sounds[name].play();
  }

  playIfNotPlaying(name: string) {
    this.sounds[name].playIfNotPlaying();
  }

  playLoopIfNotPlaying(name: string) {
    this.sounds[name].playLoopIfNotPlaying();
  }

  stopAll() {
    Object.keys(this.sounds).forEach((name) => {
      this.sounds[name].stop();
    });
  }

  setGlobalMuted(isGlobalMuted: boolean): void {
    this.globalMuted = isGlobalMuted;

    Object.keys(this.sounds).forEach((name) => {
      this.sounds[name].setGlobalMuted(isGlobalMuted);
    });
  }
}

export class Sound {
  public readonly audioElement: HTMLAudioElement;
  private localMuted = false;
  private globalMuted = false;

  constructor(audioElement: HTMLAudioElement) {
    this.audioElement = audioElement;
  }

  public isLoaded(): boolean {
    return this.audioElement.readyState === 4;
  }

  public play(): void {
    this.stop();
    this.audioElement.loop = false;
    this.audioElement.play();
  }

  public playIfNotPlaying(): void {
    if (this.isPlaying()) return;
    this.play();
  }

  public playLoopIfNotPlaying(): void {
    if (this.isPlaying()) return;
    this.playLoop();
  }

  public isPlaying(): boolean {
    return !this.audioElement.paused;
  }

  public playLoop(): void {
    this.stop();
    this.audioElement.loop = true;
    this.audioElement.play();
  }

  public resume(): void {
    this.audioElement.play();
  }

  public pause(): void {
    this.audioElement.pause();
  }

  public stop(): void {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
  }

  public canResume(): boolean {
    // TODO: what if 0?
    return (
      this.audioElement.paused &&
      !this.audioElement.ended &&
      this.audioElement.currentTime > 0
    );
  }

  public setMuted(isMuted: boolean): void {
    this.localMuted = isMuted;
    this.updateElementMuted();
  }

  public isMuted(): boolean {
    return this.localMuted;
  }

  public setGlobalMuted(isGlobalMuted: boolean): void {
    this.globalMuted = isGlobalMuted;
    this.updateElementMuted();
  }

  public isGlobalMuted(): boolean {
    return this.globalMuted;
  }

  private updateElementMuted(): void {
    this.audioElement.muted = this.globalMuted || this.localMuted;
  }
}
