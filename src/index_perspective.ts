import { Keycodes, listenKeyboard } from './controls.js';
import { createRangeValue } from './debug.js';

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

const WIDTH = 640;
const HEIGHT = 480;
const MAX_ANGLE = 40;
const GRID_HOR_COUNT = 10;
const W_COUNT = 5;

const vanishYValue = createRangeValue({
  title: 'vanishY',
  initialValue: HEIGHT / 2,
  min: 0,
  max: HEIGHT,
});
const horizonYValue = createRangeValue({
  title: 'horizonY',
  initialValue: HEIGHT / 2,
  min: 0,
  max: HEIGHT,
});
const gridStepXValue = createRangeValue({
  title: 'grisStepX',
  initialValue: 128,
  min: 10,
  max: 1000,
});
const horOffsetX = createRangeValue({
  title: 'horOffsetX',
  initialValue: 200,
  min: 0,
  max: 3000,
});
const lineCountValue = createRangeValue({
  title: 'lineCount',
  initialValue: 50,
  min: 1,
  max: 500,
});

const { isDown } = listenKeyboard();

const vanishX = WIDTH / 2;

// const horizonY = HEIGHT / 2;
// const vanishY = 100;

// console.log({ GRID_STEP });

canvas.width = WIDTH;
canvas.height = HEIGHT;

context.imageSmoothingEnabled = false;
context.fillRect(5, 5, 5, 5);

let positionX = 0;
let positionY = 0;

function loop() {
  if (isDown(Keycodes.Left)) {
    positionX -= 1;
  } else if (isDown(Keycodes.Right)) {
    positionX += 1;
  }
  if (isDown(Keycodes.Up)) {
    positionY -= 1;
  } else if (isDown(Keycodes.Down)) {
    positionY += 1;
  }

  const vanishY = vanishYValue.get();
  const horizonY = horizonYValue.get();
  const gridStepX = gridStepXValue.get();
  const lineCount = lineCountValue.get();
  const f1X = WIDTH / 2 - horOffsetX.get();

  context.fillStyle = '#88a';
  context.fillRect(0, 0, WIDTH, horizonYValue.get());

  context.fillStyle = '#aa8';
  context.fillRect(0, horizonY, WIDTH, HEIGHT - horizonY);

  // const f1X = WIDTH / 2 - 200;
  const f1Y = horizonY;

  const interYs = [];

  let drawLeft = true;
  for (let i = 0; i <= lineCount; i++) {
    let nearX = WIDTH / 2 + positionX + gridStepX * i;
    if (drawLeft) {
      nearX = WIDTH / 2 + positionX - gridStepX * i;
    }

    const nearY = HEIGHT;

    const m = (nearY - vanishY) / (nearX - vanishX);

    const farX = nearX - (nearY - horizonY) / m;
    const farY = horizonY;

    context.beginPath();
    context.moveTo(nearX, nearY);
    context.lineTo(farX, farY);
    context.stroke();

    const interM = (nearY - f1Y) / (nearX - f1X);
    const interX = WIDTH / 2;
    const interY = nearY - interM * (nearX - interX);

    // context.beginPath();
    // context.moveTo(nearX, nearY);
    // context.lineTo(f1X, f1Y);
    // context.stroke();

    if (drawLeft) {
      drawLeft = false;
    } else {
      interYs.push(interY);
      drawLeft = true;
      i--;
    }
  }

  // console.log(interYs);

  const interDistances = [];
  for (let i = 0; i < interYs.length; i++) {
    // const prev = interYs[i - 1];
    // if (prev === undefined) continue;

    // interDistances.push(prev - interYs[i]);

    context.beginPath();
    context.moveTo(0, interYs[i] + positionY);
    context.lineTo(WIDTH, interYs[i] + positionY);
    context.stroke();

    context.fillStyle = '#f00';
    context.fillRect(WIDTH / 2 - 1, interYs[i] - 1, 3, 3);
  }

  // console.log(interDistances);

  // const rels = [];
  // for (let i = 0; i < interDistances.length; i++) {
  //   const prev = interDistances[i - 1];
  //   if (prev === undefined) continue;

  //   rels.push(prev / interDistances[i]);
  // }

  // console.log(rels);

  // console.log(interYs);

  // for (let i = 0; i <= GRID_HOR_COUNT; i++) {
  //   const step = (HEIGHT - horizonY) / GRID_HOR_COUNT;
  //   // console.log({ step });
  //   // const step = HEIGHT / 2 / GRID_HOR_COUNT;
  //   // const prox = (step * i) / (HEIGHT / 2);
  //   // // console.log(step, prox);
  //   const y = HEIGHT - step * i + (positionY % step);

  //   if (y < horizonY) continue;

  //   context.beginPath();
  //   context.moveTo(0, y);
  //   context.lineTo(WIDTH, y);
  //   context.stroke();
  // }

  requestAnimationFrame(loop);
}

loop();
