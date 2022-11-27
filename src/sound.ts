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

  constructor(private readonly audioCtx) {}

  play(name: string) {
    this.sounds[name].play();
  }

  playLoop(name: string) {
    this.sounds[name].playLoop();
  }

  playIfNotPlaying(name: string) {
    this.sounds[name].playIfNotPlaying();
  }

  playLoopIfNotPlaying(name: string) {
    this.sounds[name].playLoopIfNotPlaying();
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
    this.audioCtx.resume();
  }

  pauseAll() {
    Object.keys(this.sounds).forEach((name) => {
      this.sounds[name].pause();
    });
    this.audioCtx.suspend();
  }

  stop(name: string) {
    this.sounds[name].stop();
  }

  stopAll() {
    Object.keys(this.sounds).forEach((name) => {
      this.sounds[name].stop();
    });
    this.audioCtx.suspend();
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
