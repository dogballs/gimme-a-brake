interface GameLoopOptions {
  // Delta limit value in seconds. Limit might be reached if game loop is paused
  // or breakpoint is activated during debugging.
  deltaTimeLimit?: number;
  fps?: number;
  onTick?: ({ deltaTime }: { deltaTime: number; lastTime: number }) => void;
}

const DEFAULT_OPTIONS = {
  deltaTimeLimit: 1,
  // requestAnimationFrame is usually 60 fps; in seconds
  fps: 60,
};

enum State {
  Idle,
  Working,
  StopRequested,
}

export class GameLoop {
  private options: GameLoopOptions;
  private lastTimestamp = null;
  private requestedStop = false;
  private state = State.Idle;

  constructor(options: GameLoopOptions = {}) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  }

  public start(): void {
    if (this.state !== State.Idle) {
      return;
    }

    this.state = State.Working;

    this.loop();
  }

  // WARNING: a couple of already queued callbacks might still fire after stop
  public stop(): void {
    if (this.state !== State.Working) {
      return;
    }

    this.state = State.StopRequested;
  }

  private loop = (timestamp = null): void => {
    if (this.state === State.Idle) {
      return;
    }

    if (this.state === State.StopRequested) {
      this.state = State.Idle;
      return;
    }

    const idealDeltaTime = this.getIdealDeltaTime();
    // For the very first run loop() is called from the code and timestamp is
    // not known. On the second call loop() is called by requestAnimationFrame,
    // which also provides a timestamp.
    // Use ideal fixed delta value for the first run.
    let deltaTime = idealDeltaTime;
    if (timestamp !== null) {
      // Timestamp is originally in milliseconds, convert to seconds
      const deltaTimestamp = timestamp - this.lastTimestamp;
      if (Math.round(this.getFpsInterval()) - Math.round(deltaTimestamp) > 2) {
        window.requestAnimationFrame(this.loop);
        return;
      }

      deltaTime = deltaTimestamp / 1000;

      // If delta is too large, we must have resumed from stop() or breakpoint.
      // Use ideal default delta only for this frame.
      if (deltaTime > this.options.deltaTimeLimit) {
        deltaTime = idealDeltaTime;
      }
    }

    this.lastTimestamp = timestamp;

    const lastTime = timestamp / 1000;

    this.options.onTick?.({ deltaTime, lastTime });

    window.requestAnimationFrame(this.loop);
  };

  private getFpsInterval(): number {
    return 1000 / this.options.fps;
  }

  private getIdealDeltaTime(): number {
    return 1 / this.options.fps;
  }
}
