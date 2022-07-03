export enum Keycodes {
  Up = 87,
  Left = 65,
  Right = 68,
  Down = 83,
}

let keys = [];

export function listenKeyboard() {
  document.addEventListener('keydown', (ev) => {
    if (!keys.includes(ev.keyCode)) {
      keys.push(ev.keyCode);
    }
  });

  document.addEventListener('keyup', (ev) => {
    keys = keys.filter((k) => k !== ev.keyCode);
  });

  return {
    getKeys() {
      return keys;
    },
    isDown(key: Keycodes) {
      return keys.includes(key);
    },
  };
}
