enum KeyboardButtonCode {
  Enter = 13,
  Space = 32,
  Left = 37,
  Up = 38,
  Right = 39,
  Down = 40,
  W = 87,
  A = 65,
  D = 68,
  S = 83,
}

export enum InputControl {
  Up,
  Down,
  Left,
  Right,
  Select,
}

const binding = {
  [InputControl.Up]: [KeyboardButtonCode.Up, KeyboardButtonCode.W],
  [InputControl.Down]: [KeyboardButtonCode.Down, KeyboardButtonCode.S],
  [InputControl.Left]: [KeyboardButtonCode.Left, KeyboardButtonCode.A],
  [InputControl.Right]: [KeyboardButtonCode.Right, KeyboardButtonCode.D],
  [InputControl.Select]: [KeyboardButtonCode.Enter, KeyboardButtonCode.Space],
};

export class KeyboardListener {
  private listenedDownCodes: number[] = [];
  private downCodes: number[] = [];
  private holdCodes: number[] = [];
  private upCodes: number[] = [];

  listen() {
    document.addEventListener('keydown', this.handleWindowKeyDown);
    document.addEventListener('keyup', this.handleWindowKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
  }

  public unlisten() {
    document.removeEventListener('keydown', this.handleWindowKeyDown);
    document.removeEventListener('keyup', this.handleWindowKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
  }

  update() {
    const codes = this.listenedDownCodes;

    const downCodes = [];
    const holdCodes = [];

    for (const code of codes) {
      // Newly pressed key, which was not previously down or hold
      if (!this.downCodes.includes(code) && !this.holdCodes.includes(code)) {
        downCodes.push(code);
      }

      // Key that was down on previous frame is now considered hold, because
      // it is still down on current frame.
      // Hold key continues to be hold.
      if (this.downCodes.includes(code) || this.holdCodes.includes(code)) {
        holdCodes.push(code);
      }
    }

    // Find keycodes that were down or hold on previous frame, which means
    // that in current frame they are considered up

    const upCodes = [];

    for (const code of this.downCodes) {
      if (!codes.includes(code)) {
        upCodes.push(code);
      }
    }

    for (const code of this.holdCodes) {
      if (!codes.includes(code)) {
        upCodes.push(code);
      }
    }

    this.downCodes = downCodes;
    this.holdCodes = holdCodes;
    this.upCodes = upCodes;
  }

  isDown(control: InputControl) {
    const codes = binding[control];
    return codes.some((code) => this.downCodes.includes(code));
  }

  isHold(control: InputControl) {
    const codes = binding[control];
    return codes.some((code) => this.holdCodes.includes(code));
  }

  getHoldLastOf(controls: InputControl[]) {
    let latestIndex = -1;
    let latestControl: InputControl = undefined;

    for (const control of controls) {
      const codes = binding[control];

      for (const code of codes) {
        const codeIndex = this.holdCodes.indexOf(code);
        if (codeIndex !== -1 && codeIndex > latestIndex) {
          latestIndex = codeIndex;
          latestControl = control;
        }
      }
    }

    return latestControl;
  }

  private handleWindowKeyDown = (ev): void => {
    const { keyCode } = ev;

    if (!this.listenedDownCodes.includes(keyCode)) {
      this.listenedDownCodes.push(keyCode);
    }
  };

  private handleWindowKeyUp = (ev): void => {
    const { keyCode } = ev;

    const index = this.listenedDownCodes.indexOf(keyCode);
    if (index !== -1) {
      this.listenedDownCodes.splice(index, 1);
    }
  };

  private handleWindowBlur = (): void => {
    this.listenedDownCodes = [];
  };
}

export function listenKeyboard(): KeyboardListener {
  const listener = new KeyboardListener();
  listener.listen();
  return listener;
}
