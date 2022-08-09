import { Keycodes, listenKeyboard } from './controls';
// import { createButton, createRangeValue } from './debug';
import { createDebugPanel, createDebugBox } from './core/debug';

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

const IMAGE_WIDTH = 320;
const IMAGE_HEIGHT = 240;

const NEAR_TEX_HEIGHT = 32;

const ROAD_IMAGE_WIDTH = 192;

canvas.width = IMAGE_WIDTH;
canvas.height = IMAGE_HEIGHT;

const horizonYBox = createDebugBox();
const curveTopStartBox = createDebugBox();
const curveTopOffsetMultBox = createDebugBox();
const widthPerLineReduceBox = createDebugBox();

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
  images.road2 = await loadImage('data/graphics/road2.png');

  draw();
}

async function draw() {
  if (getKeys().includes(Keycodes.Up)) {
    state.moveOffset += speed;
  } else if (getKeys().includes(Keycodes.Down)) {
    state.moveOffset -= speed;
  }

  const horizonY = horizonYBox.get();

  // Sky
  context.fillStyle = '#88a';
  context.fillRect(0, 0, IMAGE_WIDTH, horizonY);

  // Ground
  context.fillStyle = '#aa8';
  context.fillRect(0, horizonY, IMAGE_WIDTH, IMAGE_HEIGHT - horizonY);

  drawRoad();

  requestAnimationFrame(draw);
}

function drawRoad() {
  // const widthList = getStraightWidthList();
  const widthList = getCurvedWidthList();
  const heightList = getSegmentHeightList();

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

  const roadHeight = IMAGE_HEIGHT - horizonYBox.get();

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

// function getStraightWidthList() {
//   let dx = 0;
//   const dxx = 1.6;
//   const NEAR_WIDTH = 400;

//   const roadHeight = IMAGE_HEIGHT - horizonYBox.get();

//   const widthList = [];

//   for (let i = 0; i <= roadHeight; i++) {
//     const x = IMAGE_WIDTH / 2 - NEAR_WIDTH / 2 + dx;
//     const width = NEAR_WIDTH - dx * 2;

//     widthList.push({
//       x,
//       width,
//     });

//     dx += dxx;
//   }

//   return widthList;
// }

function getCurvedWidthList() {
  const roadHeight = IMAGE_HEIGHT - horizonYBox.get();

  const curveTopStart = roadHeight - curveTopStartBox.get();
  // const curveBottomStart = curveBottomStartValue.get();
  const curveTopOffsetMult = curveTopOffsetMultBox.get();

  const NEAR_WIDTH = 400;

  const perIterationReduce = widthPerLineReduceBox.get();

  let topOffset = 0;
  let perIterationTopOffset = 0;

  let bottomOffset = 0;
  let perIterationBottomOffset = 0;

  const widthList = [];

  for (let i = 0; i <= roadHeight; i++) {
    const widthReduce = i * perIterationReduce;
    const straightX = IMAGE_WIDTH / 2 - NEAR_WIDTH / 2 + widthReduce;
    const width = NEAR_WIDTH - widthReduce * 2;

    const topCurveX = straightX - topOffset;
    const bottomCurveX = straightX - bottomOffset;

    // if (i <= curveBottomStart) {
    //   widthList.push({
    //     x: straightX,
    //     width,
    //   });
    // } else
    if (i >= curveTopStart) {
      widthList.push({
        x: topCurveX,
        width,
      });
      topOffset += perIterationTopOffset;
      perIterationTopOffset += curveTopOffsetMult;
    } else {
      widthList.push({
        x: straightX,
        width,
      });
    }
  }

  return widthList;
}

function getSegmentHeightList() {
  const roadHeight = IMAGE_HEIGHT - horizonYBox.get();

  const heightList = [];

  const { moveOffset } = state;
  const isNegativeMoveOffset = moveOffset < 0;

  // Will be used in a function to calculate how much the next road segment will
  // be downscaled compared to the previous one because next segment is further
  // into the road.
  let downscaleIndex = 1;

  // Based on the nearest segment and global offset calculate how much thi
  //  nearest segment is offset from zero position. We are going to offset
  // all of the following segments based on the same percentages.
  let restFillPercent =
    Math.abs(moveOffset % NEAR_TEX_HEIGHT) / NEAR_TEX_HEIGHT;
  let primFillPercent = 1 - restFillPercent;

  // If we are going below zero swap the percentages because the other texture
  // will be rendered first
  if (isNegativeMoveOffset) {
    primFillPercent = 1 - primFillPercent;
    restFillPercent = 1 - restFillPercent;
  }

  // Figure out which texture is rendered first in the current loop based on the
  // global offset
  let primTextureIndex =
    Math.floor(Math.abs(state.moveOffset) / NEAR_TEX_HEIGHT) % 2;
  // If we are going negative choose the other texture
  if (isNegativeMoveOffset) {
    primTextureIndex = 1 - primTextureIndex;
  }

  let currentY = 0;
  let roadLeftToParse = roadHeight;

  while (roadLeftToParse >= 0) {
    const downscaleMultiplier = 1.3 / downscaleIndex;
    const segmentHeight = Math.round(downscaleMultiplier * NEAR_TEX_HEIGHT);

    // Segment is split into two sub-segments based on the global offset.
    // Each segment has it's own texture.
    const primTextureHeight = segmentHeight * primFillPercent;
    const restTextureHeight = segmentHeight - primTextureHeight;

    // Add both sub-segments as separate entries of their own height with
    // corresponding texture indexes
    if (primTextureHeight !== 0) {
      heightList.push({
        y: currentY,
        y2: currentY + primTextureHeight,
        height: primTextureHeight,
        textureIndex: primTextureIndex,
      });
    }
    if (restTextureHeight !== 0) {
      heightList.push({
        y: currentY + primTextureHeight,
        y2: currentY + segmentHeight,
        height: restTextureHeight,
        textureIndex: 1 - primTextureIndex,
      });
    }

    roadLeftToParse -= segmentHeight;
    currentY += segmentHeight;
    downscaleIndex++;
    // Alernate to the other texture and make it primary
    primTextureIndex = 1 - primTextureIndex;
  }

  return heightList;
}

function move(moveOffset) {
  state.moveOffset += moveOffset;
  draw();
}

main();

// @ts-ignore
window.move = (moveOffset) => {
  move(moveOffset);
};

createDebugPanel({
  sections: [
    {
      title: 'Curve',
      items: [
        {
          type: 'range',
          title: 'horizonY',
          box: horizonYBox,
          initial: IMAGE_HEIGHT / 2,
          min: 0,
          max: IMAGE_HEIGHT,
        },
        {
          type: 'range',
          title: 'cureveTopOffsetMult',
          box: curveTopOffsetMultBox,
          initial: 0.05,
          min: 0,
          max: 1,
          step: 0.01,
        },
        {
          type: 'range',
          title: 'curveTopStart',
          box: curveTopStartBox,
          initial: 40,
          min: 0,
          max: IMAGE_HEIGHT,
        },
        {
          type: 'range',
          title: 'widthPerLineReduce',
          box: widthPerLineReduceBox,
          initial: 1.6,
          min: 0,
          max: 3,
          step: 0.05,
        },
      ],
    },
    {
      title: 'Move',
      items: [
        {
          type: 'button',
          title: '+1',
          onClick: () => {
            move(1);
          },
        },
      ],
    },
  ],
});

// const curveBottomStartValue = createRangeValue({
//   title: 'curveBottomStart',
//   initialValue: 0,
//   min: 0,
//   max: IMAGE_HEIGHT,
// });
// const curveBottomOffsetMultValue = createRangeValue({
//   title: 'cureveBottomOffsetMult',
//   initialValue: 0.05,
//   min: 0,
//   max: 3,
//   step: 0.01,
// });
