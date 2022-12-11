enum KeyboardButtonCode {
  Backspace = 8,
  Enter = 13,
  Esc = 27,
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

// Values are button indexes based on https://w3c.github.io/gamepad/#remapping
enum GamepadButtonCode {
  A = 0,
  B = 1,
  X = 2,
  Y = 3,
  LeftBumper = 4,
  RightBumper = 5,
  LeftTrigger = 6,
  RightTrigger = 7,
  Select = 8,
  Back = 8,
  Start = 9,
  Forward = 9,
  LeftStick = 10,
  RightStick = 11,
  Up = 12,
  Down = 13,
  Left = 14,
  Right = 15,
}

export enum InputControl {
  Up,
  Down,
  Left,
  Right,
  Select,
  Back,
}

type InputButtonCode = KeyboardButtonCode | GamepadButtonCode;
type InputBinding = Map<InputControl, InputButtonCode[]>;

const KEYBOARD_BINDING: InputBinding = new Map<
  InputControl,
  KeyboardButtonCode[]
>();
KEYBOARD_BINDING.set(InputControl.Up, [
  KeyboardButtonCode.Up,
  KeyboardButtonCode.W,
]);
KEYBOARD_BINDING.set(InputControl.Down, [
  KeyboardButtonCode.Down,
  KeyboardButtonCode.S,
]);
KEYBOARD_BINDING.set(InputControl.Left, [
  KeyboardButtonCode.Left,
  KeyboardButtonCode.A,
]);
KEYBOARD_BINDING.set(InputControl.Right, [
  KeyboardButtonCode.Right,
  KeyboardButtonCode.D,
]);
KEYBOARD_BINDING.set(InputControl.Select, [
  KeyboardButtonCode.Enter,
  KeyboardButtonCode.Space,
]);
KEYBOARD_BINDING.set(InputControl.Back, [
  KeyboardButtonCode.Esc,
  KeyboardButtonCode.Backspace,
]);

const GAMEPAD_BINDING: InputBinding = new Map<
  InputControl,
  GamepadButtonCode[]
>();
GAMEPAD_BINDING.set(InputControl.Up, [GamepadButtonCode.Up]);
GAMEPAD_BINDING.set(InputControl.Down, [GamepadButtonCode.Down]);
GAMEPAD_BINDING.set(InputControl.Left, [GamepadButtonCode.Left]);
GAMEPAD_BINDING.set(InputControl.Right, [GamepadButtonCode.Right]);
GAMEPAD_BINDING.set(InputControl.Select, [
  GamepadButtonCode.X,
  GamepadButtonCode.Y,
  GamepadButtonCode.A,
  GamepadButtonCode.B,
]);
GAMEPAD_BINDING.set(InputControl.Back, [
  GamepadButtonCode.Start,
  GamepadButtonCode.Back,
]);

interface InputDevice {
  isConnected(): boolean;
  listen(): void;
  unlisten(): void;
  update(): void;
  getDownCodes(): number[];
  getHoldCodes(): number[];
  getUpCodes(): number[];
}

class KeyboardInputDevice implements InputDevice {
  private listenedDownCodes: number[] = [];
  private downCodes: number[] = [];
  private holdCodes: number[] = [];
  private upCodes: number[] = [];

  isConnected() {
    return true;
  }

  listen() {
    document.addEventListener('keydown', this.handleWindowKeyDown);
    document.addEventListener('keyup', this.handleWindowKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
  }

  unlisten() {
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

  getDownCodes() {
    return this.downCodes;
  }

  getHoldCodes() {
    return this.holdCodes;
  }

  getUpCodes() {
    return this.upCodes;
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

const GAMEPAD_AXIS_THRESHOLD = 0.8;

class GamepadInputDevice implements InputDevice {
  private deviceIndex: number = 0;
  private isListening = false;
  private downCodes: number[] = [];
  private holdCodes: number[] = [];
  private upCodes: number[] = [];

  isConnected() {
    const gamepad = this.getGamepad();

    if (gamepad === null) {
      return false;
    }

    return true;
  }

  listen() {
    this.isListening = true;
  }

  unlisten() {
    this.isListening = false;
  }

  update() {
    if (!this.isListening) {
      return;
    }

    const gamepad = this.getGamepad();
    if (gamepad === null) {
      return;
    }

    // Extract buttons that are in pressed state
    const codes = new Set<GamepadButtonCode>();

    const { buttons } = gamepad;
    for (let i = 0; i < buttons.length; i += 1) {
      const button = buttons[i];
      if (button.pressed === true) {
        codes.add(i);
      }
    }

    // Convert left stick movements to left/right/up/down button presses
    if (gamepad.axes.length >= 2) {
      const leftStickX = gamepad.axes[0];
      const leftStickY = gamepad.axes[1];

      if (leftStickX < -GAMEPAD_AXIS_THRESHOLD) {
        codes.add(GamepadButtonCode.Left);
      } else if (leftStickX > GAMEPAD_AXIS_THRESHOLD) {
        codes.add(GamepadButtonCode.Right);
      }
      if (leftStickY < -GAMEPAD_AXIS_THRESHOLD) {
        codes.add(GamepadButtonCode.Up);
      } else if (leftStickY > GAMEPAD_AXIS_THRESHOLD) {
        codes.add(GamepadButtonCode.Down);
      }
    }

    const downCodes = [];
    const holdCodes = [];

    for (const code of codes) {
      // Newly pressed key, which was not previously down or hold
      if (!this.downCodes.includes(code) && !this.holdCodes.includes(code)) {
        downCodes.push(code);
      }

      // Button that was down on previous frame is now considered hold, because
      // it is still down on current frame.
      // Hold continues to be hold.
      if (this.downCodes.includes(code) || this.holdCodes.includes(code)) {
        holdCodes.push(code);
      }
    }

    // Find buttons that were down or hold on previous frame, which means
    // that in current frame they are considered up

    const upCodes = [];

    for (const code of this.downCodes) {
      if (!codes.has(code)) {
        upCodes.push(code);
      }
    }

    for (const code of this.holdCodes) {
      if (!codes.has(code)) {
        upCodes.push(code);
      }
    }

    this.downCodes = downCodes;
    this.holdCodes = holdCodes;
    this.upCodes = upCodes;
  }

  getDownCodes() {
    return this.downCodes;
  }

  getHoldCodes() {
    return this.holdCodes;
  }

  getUpCodes() {
    return this.upCodes;
  }

  private getGamepad(): Gamepad {
    const gamepads = navigator.getGamepads();

    // Firefox will have empty array
    if (gamepads.length === 0) {
      return null;
    }

    const gamepad = gamepads[this.deviceIndex];

    // Chrome will have filled array of 4 elements with null values
    // Value will be null after device is connected or page is reloaded,
    // until user has pressed any button.
    if (gamepad === null) {
      return null;
    }

    return gamepad;
  }
}

class InputMethod {
  constructor(readonly device: InputDevice, readonly binding: InputBinding) {}

  isDown(control: InputControl) {
    const codes = this.unmap(control);
    const downCodes = this.device.getDownCodes();
    return codes.some((code) => downCodes.includes(code));
  }

  getHoldLastOf(controls: InputControl[]): InputControl {
    let latestIndex = -1;
    let latestControl: InputControl = undefined;

    const holdCodes = this.device.getHoldCodes();

    for (const control of controls) {
      const codes = this.unmap(control);

      for (const code of codes) {
        const codeIndex = holdCodes.indexOf(code);
        if (codeIndex !== -1 && codeIndex > latestIndex) {
          latestIndex = codeIndex;
          latestControl = control;
        }
      }
    }

    return latestControl;
  }

  private unmap(control: number): InputButtonCode[] {
    return this.binding.get(control);
  }
}

enum InputDeviceType {
  Keyboard,
  Gamepad,
}

export class InputController {
  private readonly methodMap = new Map<InputDeviceType, InputMethod>();
  private activeDeviceType: InputDeviceType = InputDeviceType.Keyboard;

  constructor() {
    this.methodMap.set(
      InputDeviceType.Keyboard,
      new InputMethod(new KeyboardInputDevice(), KEYBOARD_BINDING),
    );
    this.methodMap.set(
      InputDeviceType.Gamepad,
      new InputMethod(new GamepadInputDevice(), GAMEPAD_BINDING),
    );
  }

  isDown(control: InputControl) {
    return this.methodMap.get(this.activeDeviceType).isDown(control);
  }

  getHoldLastOf(controls: InputControl[]) {
    return this.methodMap.get(this.activeDeviceType).getHoldLastOf(controls);
  }

  update() {
    const activeDevice = this.methodMap.get(this.activeDeviceType).device;

    this.methodMap.forEach((method, deviceType) => {
      method.device.update();

      // Check each device if it has any events. If it does, and it is not an active device - activate a new one.
      const downCodes = method.device.getDownCodes();
      const hasActivity = downCodes.length > 0;

      const isSameDeviceActive = activeDevice === method.device;

      if (hasActivity && !isSameDeviceActive) {
        this.activeDeviceType = deviceType;
      }
    });
  }

  listen() {
    this.methodMap.forEach((method) => {
      method.device.listen();
    });
  }

  unlisten() {
    this.methodMap.forEach((method) => {
      method.device.unlisten();
    });
  }
}
