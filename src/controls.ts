enum KeyboardButtonCode {
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
}

const binding = {
  [InputControl.Up]: [KeyboardButtonCode.Up, KeyboardButtonCode.W],
  [InputControl.Down]: [KeyboardButtonCode.Down, KeyboardButtonCode.S],
  [InputControl.Left]: [KeyboardButtonCode.Left, KeyboardButtonCode.A],
  [InputControl.Right]: [KeyboardButtonCode.Right, KeyboardButtonCode.D],
};

let internalCodes = [];

export function listenKeyboard() {
  document.addEventListener('keydown', (ev) => {
    if (!internalCodes.includes(ev.keyCode)) {
      internalCodes.push(ev.keyCode);
    }
  });

  document.addEventListener('keyup', (ev) => {
    internalCodes = internalCodes.filter((k) => k !== ev.keyCode);
  });

  return {
    isDown(control: InputControl) {
      const codes = binding[control];
      return codes.some((code) => internalCodes.includes(code));
    },
  };
}
