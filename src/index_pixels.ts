import { Keycodes, listenKeyboard } from './controls';
import { getSegmentHeightList } from './segment_height';
import { getStraightWidthList } from './straight_segment_width';
import { getCurvedWidthList } from './curved_segment_width';
import { installDebug } from './install_debug';

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

const IMAGE_WIDTH = 320;
const IMAGE_HEIGHT = 240;

const ROAD_IMAGE_WIDTH = 192;

canvas.width = IMAGE_WIDTH;
canvas.height = IMAGE_HEIGHT;

const { getKeys } = listenKeyboard();

const state = {
  speed: 3,
  moveOffset: 0,
  nextTurn: undefined,
};

const images = {
  road2: undefined,
};

const { updateMoveOffsetLabel } = installDebug({
  onMove: move,
  onAddTurn: addTurn,
  onSpeedChange: (speed: number) => {
    state.speed = speed;
  },
});

async function loadImage(imagePath: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.src = imagePath;
    image.addEventListener('load', () => {
      resolve(image);
    });
  });
}

async function main() {
  images.road2 = await loadImage('data/graphics/road2.png');

  loop();
}

const turnStart = 100;
const turnEnd = 1100;

function loop() {
  if (getKeys().includes(Keycodes.Up)) {
    state.moveOffset += state.speed;
  } else if (getKeys().includes(Keycodes.Down)) {
    state.moveOffset -= state.speed;
  }

  updateMoveOffsetLabel(state.moveOffset.toString());

  draw();

  requestAnimationFrame(loop);
}

function draw() {
  const horizonY = IMAGE_HEIGHT / 2;

  // Sky
  context.fillStyle = '#88a';
  context.fillRect(0, 0, IMAGE_WIDTH, horizonY);

  // Ground
  context.fillStyle = '#aa8';
  context.fillRect(0, horizonY, IMAGE_WIDTH, IMAGE_HEIGHT - horizonY);

  drawRoad();
}

function drawRoad() {
  const horizonY = IMAGE_HEIGHT / 2;
  const roadHeight = IMAGE_HEIGHT - horizonY;

  const { moveOffset, nextTurn } = state;

  const widthList = getCurvedWidthList({
    roadHeight,
    imageWidth: IMAGE_WIDTH,
    moveOffset,
    turnStart: nextTurn?.start,
    turnEnd: nextTurn?.end,
  });

  const heightList = getSegmentHeightList({
    roadHeight,
    moveOffset,
  });

  const getTextureIndexForY = (y) => {
    for (let i = 0; i < heightList.length; i++) {
      const heightEntry = heightList[i];
      if (heightEntry.y <= y && heightEntry.y2 >= y) {
        return heightEntry.textureIndex;
      }
    }
    throw new Error(`Could not find height entry for y=${y}`);
  };

  const groundColors = ['#aa8', '#aa8'];

  const textureSources = [
    { y: 0, height: 1 },
    { y: 33, height: 1 },
  ];

  for (let y = 0; y <= roadHeight; y++) {
    const sourceX = 0;
    const sourceW = ROAD_IMAGE_WIDTH;

    const { x: destX, width: destW } = widthList[y];

    const textureIndex = getTextureIndexForY(y);

    const sourceY = textureSources[textureIndex].y;
    const sourceH = textureSources[textureIndex].height;

    const destY = IMAGE_HEIGHT - y;
    const destH = 1;

    context.fillStyle = groundColors[textureIndex];
    context.fillRect(0, IMAGE_HEIGHT - y, IMAGE_WIDTH, 1);

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

function move(moveOffset) {
  state.moveOffset += moveOffset;
  draw();
}

function addTurn({ offset, size }: { offset: number; size: number }) {
  state.nextTurn = {
    start: state.moveOffset + offset,
    end: state.moveOffset + offset + size,
  };
}

main();

// @ts-ignore
window.move = (moveOffset) => {
  move(moveOffset);
};
