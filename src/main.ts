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
import { drawRoadMask, drawRoadCurb } from './road';
import { drawGroundStripes, drawRoadStripes } from './stripes';
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
  drawRoadStripes(ctx, { moveOffset: state.moveOffset, yOverride });

  // Then cut it out and keep the area that is actually covered by the road
  // (the ground area will become transparent again).
  ctx.globalCompositeOperation = 'destination-in';
  drawRoadMask(ctx, path, { steerOffset: state.steerOffset });

  // Then draw the ground stripes full widths but behind the road - it will keep
  // the road that was drawn on the previous step and only fill in the ground
  // stripes on the sides.
  ctx.globalCompositeOperation = 'destination-over';
  drawGroundStripes(ctx, { moveOffset: state.moveOffset, yOverride });

  // Then draw everything on top
  ctx.globalCompositeOperation = 'source-over';

  drawRoadCurb(ctx, path, {
    moveOffset: state.moveOffset,
    steerOffset: state.steerOffset,
  });

  drawHorizon({ yOverride });
  drawGrid();
  drawCar();

  drawDebug();
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
