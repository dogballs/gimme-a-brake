import { Keycodes, listenKeyboard } from './controls.js';

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

const IMAGE_WIDTH = 320;
const IMAGE_HEIGHT = 240;

const HORIZON_Y = IMAGE_HEIGHT / 2;

const NEAR_TEX_HEIGHT = 32;

const ROAD_IMAGE_WIDTH = 192;

const ROAD_HEIGHT = IMAGE_HEIGHT - HORIZON_Y;

canvas.width = IMAGE_WIDTH;
canvas.height = IMAGE_HEIGHT;

async function loadImage(imagePath: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.src = imagePath;
    image.addEventListener('load', () => {
      resolve(image);
    });
  });
}

const { getKeys } = listenKeyboard();

const speed = 3;

const state = {
  moveOffset: 0,
};

const images = {
  road2: undefined,
};

async function main() {
  images.road2 = await loadImage('data/road2.png');

  road();
}

async function road() {
  if (getKeys().includes(Keycodes.Up)) {
    state.moveOffset += speed;
  } else if (getKeys().includes(Keycodes.Down)) {
    state.moveOffset -= speed;
  }

  context.fillStyle = '#88a';
  context.fillRect(0, 0, IMAGE_WIDTH, HORIZON_Y);

  context.fillStyle = '#aa8';
  context.fillRect(0, HORIZON_Y, IMAGE_WIDTH, IMAGE_HEIGHT - HORIZON_Y);

  straight();

  requestAnimationFrame(road);
}

function straight() {
  const hors = getHors();
  const vers = getVerts();

  const getTextureIndex = (y) => {
    for (let i = 0; i < vers.length; i++) {
      if (vers[i][0] <= y && vers[i][1] >= y) {
        return vers[i][3];
      }
    }
  };

  const textures = [
    [0, 1],
    [33, 1],
  ];

  let verIndex = 0;

  for (let i = 0; i <= ROAD_HEIGHT; i++) {
    const sourceX = 0;
    const sourceW = ROAD_IMAGE_WIDTH;

    const [destX, destW] = hors[i];

    const ti = getTextureIndex(i);

    const sourceY = textures[ti][0];
    const sourceH = textures[ti][1];

    const destY = IMAGE_HEIGHT - i;
    const destH = 1;

    context.drawImage(
      images.road2,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      destX,
      destY,
      destW,
      destH,
    );
  }
}

function getHors() {
  let dx = 0;
  const dxx = 1.6;
  const NEAR_WIDTH = 400;

  const widths = [];

  for (let i = 0; i <= ROAD_HEIGHT; i++) {
    const x = IMAGE_WIDTH / 2 - NEAR_WIDTH / 2 + dx;
    const w = NEAR_WIDTH - dx * 2;

    widths.push([x, w]);

    dx += dxx;
  }

  return widths;
}

function getVerts() {
  const hs = [];
  const vers = [];

  let left = ROAD_HEIGHT;
  let i = 1;
  let y = 0;

  const ofp = Math.abs(state.moveOffset % NEAR_TEX_HEIGHT) / NEAR_TEX_HEIGHT;
  const ofps = 1 - ofp;

  const p = Math.floor(Math.abs(state.moveOffset) / NEAR_TEX_HEIGHT) % 2;

  let prim = !!p;
  if (state.moveOffset < 0) {
    prim = !prim;
  }

  while (left >= 0) {
    const m = 1.3 / i;
    const h = Math.round(m * NEAR_TEX_HEIGHT);

    const t1 = h * (state.moveOffset < 0 ? ofp : ofps);
    const t2 = h - t1;

    if (t1 !== 0) {
      hs.push([y, y + t1, t1, prim ? 1 : 0]);
    }
    if (t2 !== 0) {
      hs.push([y + t1, y + h, t2, prim ? 0 : 1]);
    }

    left -= h;
    y += h;
    i++;
    prim = !prim;

    if (left <= 0) {
      break;
    }
  }

  return hs;
}

main();
