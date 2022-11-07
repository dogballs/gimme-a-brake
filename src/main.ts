import {
  IW,
  IH,
  HW,
  HH,
  MOVE_SPEED,
  STEER_SPEED,
  STEER_LIMIT,
  STEER_TURN_COUNTER_FORCE,
} from './config';
import { Keycodes, listenKeyboard } from './controls';
import {
  straightFragment,
  createTurn,
  createUphill,
  createDownhill,
  lerpFragments,
} from './fragment';
import { map } from './map';
import {
  CoordDescriptor,
  LineDescriptor,
  PathDescriptor,
  Fragment,
  Section,
} from './types';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = IW;
canvas.height = IH;

canvas.addEventListener('click', (ev) => {
  console.log(ev.clientX / 2, ev.clientY / 2);
});

const { getKeys } = listenKeyboard();

const state = {
  moveSpeed: 0,
  moveOffset: 0,
  steerSpeed: 0,
  steerOffset: 0,
};

const images = {
  car: undefined,
  pattern: undefined,
};

const patterns = {
  left: undefined,
};

function draw() {
  ctx.clearRect(0, 0, IW, IH);

  grid();

  let activeSection: Section = map.sections.find((s) => {
    return state.moveOffset >= s.start && state.moveOffset <= s.start + s.size;
  });
  if (!activeSection || hasSectionEnded(activeSection)) {
    activeSection = { start: state.moveOffset, kind: 'straight', size: 0 };
  }

  const inSectionOffset = state.moveOffset - activeSection.start;

  drawInfo({ section: activeSection.kind });

  if (activeSection.kind === 'straight') {
    drawHorizon();
    drawPath(straightFragment);
    drawCar();
    return;
  }

  if (
    activeSection.kind === 'turn-right' ||
    activeSection.kind === 'turn-left'
  ) {
    if (state.moveSpeed > 0) {
      if (activeSection.kind === 'turn-left') {
        state.steerOffset -= STEER_TURN_COUNTER_FORCE;
      } else if (activeSection.kind === 'turn-right') {
        state.steerOffset += STEER_TURN_COUNTER_FORCE;
      }
    }

    const fragments = createTurn({
      size: activeSection.size,
      direction: activeSection.kind === 'turn-right' ? 'right' : 'left',
      steerOffset: state.steerOffset,
    });

    const path = lerpFragments({
      fragments,
      inOffset: inSectionOffset,
    });

    drawHorizon();
    drawPath(path);
    drawCar();
    return;
  }

  if (activeSection.kind === 'downhill') {
    const fragments = createDownhill({
      size: activeSection.size,
      inOffset: inSectionOffset,
      steepness: activeSection.steepness,
      steerOffset: state.steerOffset,
    });

    const path = lerpFragments({
      fragments,
      inOffset: inSectionOffset,
    });

    const yOverride = path.left[3];

    drawHorizon({ yOverride });

    drawPath(path);

    drawCar();

    return;
  }

  if (activeSection.kind === 'uphill') {
    const fragments = createUphill({
      size: activeSection.size,
      inOffset: inSectionOffset,
      steepness: activeSection.steepness,
      steerOffset: state.steerOffset,
    });

    const path = lerpFragments({
      fragments,
      inOffset: inSectionOffset,
    });

    const yOverride = path.left[3];

    drawHorizon({ yOverride });

    drawPath(path);

    drawCar();

    return;
  }
}

function hasSectionEnded(section: Section) {
  return section.start + section.size < state.moveOffset;
}

function drawHorizon({ yOverride }: { yOverride?: number } = {}) {
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(0, yOverride ?? HH);
  ctx.lineTo(IW, yOverride ?? HH);
  ctx.stroke();
}

function grid() {
  ctx.setLineDash([]);
  ctx.strokeStyle = '#cccccc77';

  ctx.moveTo(HW, 0);
  ctx.lineTo(HW, IH);
  ctx.stroke();
}

function drawInfo({ section }: { section?: string } = {}) {
  ctx.strokeStyle = '#000';
  ctx.font = '8px serif';

  ctx.strokeText(`move offset: ${state.moveOffset}`, 5, 10);
  ctx.strokeText(`steer: ${state.steerOffset}`, 5, 30);

  if (section) {
    ctx.strokeText(`section kind: ${section}`, 5, 20);
  }
}

function drawPath(
  { left, right, bottomLeft, bottomRight }: PathDescriptor,
  { color = 'red' }: { color?: string } = {},
) {
  ctx.strokeStyle = color;
  ctx.setLineDash([10]);
  ctx.lineDashOffset = state.moveOffset;

  // ctx.lineWidth = 2;
  // ctx.strokeStyle = patterns.left;

  // (0, 150) (180, 100)
  // 5x + 18y = 2700
  // 5x = 2700 - 18y
  // x = (2700 - 18y) / 5
  // x = (2700 - 18 * 200) / 5

  const steerOffset = state.steerOffset * 1;

  const bottomLeftX = bottomLeft?.[0] ?? -180;
  const bottomRightX = bottomRight?.[0] ?? 560;

  ctx.beginPath();
  ctx.moveTo(bottomLeftX + steerOffset, 200);
  ctx.quadraticCurveTo(...left);
  ctx.stroke();

  // 18 y - 5 x = 800
  // -5x = 800 - 18y
  // 5x = 18y - 800
  // x = (18y - 800) / 5
  // x = (18 * 200 - 800) / 5

  ctx.beginPath();
  ctx.moveTo(bottomRightX + steerOffset, 200);
  ctx.quadraticCurveTo(...right);
  ctx.stroke();
}

function drawCar() {
  const image = images.car;
  const scale = 0.6;

  const centerX = (IW - image.width * scale) / 2;
  const steerOffset = -1 * state.steerOffset * 0.02;

  const x = centerX + steerOffset;
  const y = 130;

  ctx.drawImage(images.car, x, y, image.width * scale, image.height * scale);
}

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
  images.car = await loadImage('data/graphics/car.png');
  images.pattern = await loadImage('data/graphics/pattern.png');

  patterns.left = ctx.createPattern(images.pattern, 'repeat');

  loop();
}

function loop() {
  if (getKeys().includes(Keycodes.Up)) {
    state.moveSpeed = MOVE_SPEED;
    state.moveOffset += state.moveSpeed;
  } else if (getKeys().includes(Keycodes.Down)) {
    state.moveSpeed = MOVE_SPEED;
    state.moveOffset -= state.moveSpeed;
  } else {
    state.moveSpeed = 0;
  }

  if (getKeys().includes(Keycodes.Left)) {
    state.steerSpeed = STEER_SPEED;
    const nextOffset = state.steerOffset + state.steerSpeed;
    state.steerOffset = Math.min(STEER_LIMIT, nextOffset);
  } else if (getKeys().includes(Keycodes.Right)) {
    state.steerSpeed = STEER_SPEED;
    const nextOffset = state.steerOffset - state.steerSpeed;
    state.steerOffset = Math.max(-STEER_LIMIT, nextOffset);
  } else {
    state.steerSpeed = 0;
  }

  draw();

  requestAnimationFrame(loop);
}

main();
