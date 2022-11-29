export type SoundMap = {
  [key: string]: Sound;
};

export async function loadSounds() {
  const sounds: [string, string, number?][] = [
    ['menu1', 'data/audio/menu1.mp3'],
    ['menu2', 'data/audio/menu2.mp3'],
    ['menu3', 'data/audio/menu3.mp3'],
    ['menuSelect1', 'data/audio/menu-select1.mp3', 0.4],
    ['menuFocus1', 'data/audio/menu-focus1.mp3', 0.4],
    ['menuFocus2', 'data/audio/menu-focus2.mp3', 0.4],
    ['theme1', 'data/audio/theme1.mp3'],
    ['lost1', 'data/audio/lost1.mp3'],
    ['upgradePicked1', 'data/audio/upgrade-picked1.mp3'],
    ['curb1', 'data/audio/curb1.mp3'],
    ['curb2', 'data/audio/curb2.mp3', 0.5],
    ['curb3', 'data/audio/curb3.mp3'],
    ['curb4', 'data/audio/curb4.mp3'],
    ['hit1', 'data/audio/hit1.mp3'],
    ['hit2', 'data/audio/hit2.mp3'],
    ['death1', 'data/audio/death1.mp3'],
    ['dolphin1', 'data/audio/dolphin1.mp3'],
    ['life1', 'data/audio/life1.mp3'],
    ['brake1', 'data/audio/brake1.mp3'],
    ['brake2', 'data/audio/brake2.mp3'],
    ['brake3', 'data/audio/brake3.mp3'],
    ['bumper1', 'data/audio/bumper1.mp3'],
    ['ufo1', 'data/audio/ufo1.mp3'],
    ['ufo2', 'data/audio/ufo2.mp3', 0.5],
    ['ufo3', 'data/audio/ufo3.mp3'],
    ['ufo4', 'data/audio/ufo4.mp3', 0.6],
    ['win1', 'data/audio/win1.mp3'],
    ['win2', 'data/audio/win2.mp3'],
  ];

  const promises = sounds.map(async ([id, path, baseVolume]) => {
    return { id, sound: await loadSound(path, baseVolume) };
  });

  const results = await Promise.all(promises);

  const map: SoundMap = {};

  results.forEach(({ id, sound }) => {
    map[id] = sound;
  });

  return map;
}

async function loadSound(audioPath: string, baseVolume = 1) {
  return new Promise<Sound>((resolve) => {
    const audioElement = new Audio();

    const sound = new Sound(audioElement, baseVolume);

    audioElement.src = audioPath;
    audioElement.addEventListener('loadeddata', () => {
      resolve(sound);
    });
  });
}

export class SoundController {
  sounds: SoundMap = {};
  private globalMuted = false;

  constructor(private readonly getContext: () => AudioContext) {}

  play(name: string) {
    if (name === 'car') {
      this.getContext().resume();
      return;
    }
    this.sounds[name].play();
  }

  playCarIntro() {
    this.getContext().resume();
  }

  playLoop(name: string) {
    this.sounds[name].playLoop();
  }

  playIfNotPlaying(name: string, volume = 1) {
    this.sounds[name].playIfNotPlaying(volume);
  }

  playLoopIfNotPlaying(name: string, volume = 1) {
    this.sounds[name].playLoopIfNotPlaying(volume);
  }

  isPlaying(name: string): boolean {
    return this.sounds[name].isPlaying();
  }

  canResume(name: string) {
    return this.sounds[name].canResume();
  }

  resumeAll() {
    Object.keys(this.sounds).forEach((name) => {
      const sound = this.sounds[name];
      if (sound.canResume()) {
        sound.resume();
      }
    });
    this.getContext().resume();
  }

  pauseAll() {
    Object.keys(this.sounds).forEach((name) => {
      this.sounds[name].pause();
    });
    this.getContext().suspend();
  }

  stop(name: string) {
    if (name === 'car') {
      this.getContext().suspend();
      return;
    }
    this.sounds[name].stop();
  }

  stopAll() {
    Object.keys(this.sounds).forEach((name) => {
      this.sounds[name].stop();
    });
    this.getContext().suspend();
  }

  setGlobalMuted(isGlobalMuted: boolean): void {
    this.globalMuted = isGlobalMuted;

    Object.keys(this.sounds).forEach((name) => {
      this.sounds[name].setGlobalMuted(isGlobalMuted);
    });
  }
}

export class Sound {
  private localMuted = false;
  private globalMuted = false;

  constructor(
    readonly audioElement: HTMLAudioElement,
    private readonly baseVolume = 1,
  ) {
    this.audioElement.volume = baseVolume;
  }

  public isLoaded(): boolean {
    return this.audioElement.readyState === 4;
  }

  public play(volume = 1): void {
    this.stop();
    this.audioElement.volume = volume;
    this.audioElement.loop = false;
    this.audioElement.play();
  }

  public playIfNotPlaying(volume = 1): void {
    if (this.isPlaying()) return;
    this.play(volume);
  }

  public playLoopIfNotPlaying(volume = 1): void {
    if (this.isPlaying()) return;
    this.playLoop(volume);
  }

  public isPlaying(): boolean {
    return !this.audioElement.paused;
  }

  public playLoop(volume = 1): void {
    this.stop();
    this.audioElement.loop = true;
    this.audioElement.volume = volume;
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
