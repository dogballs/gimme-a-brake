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
import { straightMap, coolMap } from './map';
import { stripesHeightList } from './stripe';
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
  map: coolMap,
  moveSpeed: 0,
  moveOffset: 0,
  steerSpeed: 0,
  steerOffset: 0,
};

const images = {
  car: undefined,
  road: undefined,
  pattern: undefined,
};

function draw() {
  ctx.clearRect(0, 0, IW, IH);

  const activeSection = getActiveSection();
  const inSectionOffset = state.moveOffset - activeSection.start;

  if (activeSection.kind === 'straight') {
    drawObjects({ path: straightFragment });
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

    drawObjects({ path });
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

    drawObjects({ path, yOverride });
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

    drawObjects({ path, yOverride });
    return;
  }
}

function getActiveSection() {
  let activeSection: Section = state.map.sections.find((s) => {
    return state.moveOffset >= s.start && state.moveOffset <= s.start + s.size;
  });
  if (!activeSection || hasSectionEnded(activeSection)) {
    activeSection = { start: state.moveOffset, kind: 'straight', size: 0 };
  }
  return activeSection;
}

function drawObjects({
  path,
  yOverride,
}: {
  path: PathDescriptor;
  yOverride?: number;
}) {
  // Draw the road stripes full widths
  drawRoadStripes({ yOverride });

  // Then cut it out and keep the area that is actually covered by the road
  // (the ground area will become transparent again).
  ctx.globalCompositeOperation = 'destination-in';
  drawRoadMask(path);

  // Then draw the ground stripes full widths but behind the road - it will keep
  // the road that was drawn on the previous step and only fill in the ground
  // stripes on the sides.
  ctx.globalCompositeOperation = 'destination-over';
  drawGroundStripes({ yOverride });

  // Then draw everything on top
  ctx.globalCompositeOperation = 'source-over';

  drawCurb(path);
  drawHorizon({ yOverride });
  drawGrid();
  drawCar();

  drawDebug();
}

function hasSectionEnded(section: Section) {
  return section.start + section.size < state.moveOffset;
}

function drawStripes({
  colors,
  yOverride,
}: {
  colors: [string, string];
  yOverride?: number;
}) {
  const roadHeight = IH - (yOverride ?? HH);

  const moveOffset = state.moveOffset * 2;

  const heightList = stripesHeightList({
    roadHeight,
    moveOffset,
  });

  for (const heightEntry of heightList) {
    ctx.fillStyle = colors[heightEntry.textureIndex];
    ctx.fillRect(0, IH - heightEntry.y2, IW, heightEntry.height);
  }
}

function drawGroundStripes({ yOverride }: { yOverride?: number } = {}) {
  drawStripes({ colors: ['#81d292', '#a3e9b2'], yOverride });
}

function drawRoadStripes({ yOverride }: { yOverride?: number } = {}) {
  drawStripes({ colors: ['#d4d79e', '#e5e9a3'], yOverride });
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

function drawGrid() {
  ctx.setLineDash([]);
  ctx.strokeStyle = '#cccccc77';

  ctx.moveTo(HW, 0);
  ctx.lineTo(HW, IH);
  ctx.stroke();
}

function drawDebug({ section }: { section?: string } = {}) {
  ctx.strokeStyle = '#000';
  ctx.font = '8px serif';

  ctx.strokeText(`move offset: ${state.moveOffset}`, 5, 10);
  ctx.strokeText(`steer: ${state.steerOffset}`, 5, 30);

  const activeSection = getActiveSection();
  ctx.strokeText(`section kind: ${activeSection.kind}`, 5, 20);
}

function drawCurb(
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

function drawRoadMask(
  { left, right, bottomLeft, bottomRight }: PathDescriptor,
  { color = 'red' }: { color?: string } = {},
) {
  const steerOffset = state.steerOffset * 1;

  const bottomLeftX = bottomLeft?.[0] ?? -180;
  const bottomRightX = bottomRight?.[0] ?? 560;

  ctx.fillStyle = 'black';

  ctx.beginPath();
  ctx.moveTo(bottomLeftX + steerOffset, 200);
  ctx.quadraticCurveTo(...left);
  ctx.lineTo(right[2], right[3]);
  ctx.quadraticCurveTo(right[0], right[1], bottomRightX + steerOffset, 200);
  ctx.lineTo(bottomLeftX + steerOffset, 200);
  ctx.fill();

  // ctx.beginPath();
  // ctx.moveTo(bottomLeftX + steerOffset, 200);
  // ctx.quadraticCurveTo(...left);
  // ctx.stroke();

  // ctx.beginPath();
  // ctx.moveTo(bottomRightX + steerOffset, 200);
  // ctx.quadraticCurveTo(...right);
  // ctx.stroke();

  // ctx.beginPath();
  // ctx.moveTo(bottomLeftX + steerOffset, 200);
  // ctx.quadraticCurveTo(...left);
  // ctx.lineTo(0, left[3]);
  // ctx.lineTo(0, IH);
  // ctx.fill();

  // ctx.beginPath();
  // ctx.moveTo(bottomRightX + steerOffset, 200);
  // ctx.quadraticCurveTo(...right);
  // ctx.lineTo(IW, right[3]);
  // ctx.lineTo(IW, IH);
  // ctx.fill();
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
  images.road = await loadImage('data/graphics/road3.png');

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
