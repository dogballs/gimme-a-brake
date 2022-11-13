import {
  IW,
  IH,
  HW,
  HH,
  BG_SPEED,
  MOVE_SPEED,
  STEER_SPEED,
  STEER_LIMIT,
  STEER_TURN_COUNTER_FORCE,
} from './config';
import { drawCar } from './car';
import { InputControl, listenKeyboard } from './controls';
import { drawCurve } from './curve';
import { drawBackground } from './background';
import { drawDecors } from './decor';
import {
  Fragment,
  straightFragment,
  createTurn,
  createUphill,
  createDownhill,
  lerpFragments,
} from './fragment';
import { loadImages } from './images';
import { straightMap, coolMap, longLeftTurnMap, longUphillMap } from './map';
import { Path } from './path';
import { drawCurbMask, drawRoadMask, drawRoadLines } from './road';
import { Section } from './section';
import { drawCurbStripes, drawGroundStripes, drawRoadStripes } from './stripes';
import { Context2D } from './types';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = IW;
canvas.height = IH;

const offCanvas = new OffscreenCanvas(IW, IH);
const offCtx = offCanvas.getContext('2d');

canvas.addEventListener('click', (ev) => {
  console.log(ev.clientX / 2, ev.clientY / 2);
});

const keyboardListener = listenKeyboard();

const resources = {
  map: coolMap,
  images: undefined,
};

const state = {
  moveSpeed: 0,
  moveOffset: 0,
  steerSpeed: 0,
  steerOffset: 0,
  bgOffset: 0,
};

const images = {
  car: undefined,
  bg1: undefined,
  bg2: undefined,
  bush: undefined,
};

function draw() {
  ctx.clearRect(0, 0, IW, IH);

  const section = getActiveSection();
  const inSectionOffset = state.moveOffset - section.start;

  if (section.kind === 'straight') {
    drawObjects({ path: straightFragment, section });
    return;
  }

  if (section.kind === 'turn-right' || section.kind === 'turn-left') {
    if (state.moveSpeed > 0) {
      if (section.kind === 'turn-left') {
        state.steerOffset -= STEER_TURN_COUNTER_FORCE;
        if (inSectionOffset > 200) {
          state.bgOffset -= BG_SPEED;
        }
      } else if (section.kind === 'turn-right') {
        state.steerOffset += STEER_TURN_COUNTER_FORCE;
        if (inSectionOffset > 200) {
          state.bgOffset += BG_SPEED;
        }
      }
    }

    const fragments = createTurn({
      size: section.size,
      direction: section.kind === 'turn-right' ? 'right' : 'left',
      steerOffset: state.steerOffset,
    });

    const path = lerpFragments({
      fragments,
      inOffset: inSectionOffset,
    });

    drawObjects({ path, section });
    return;
  }

  if (section.kind === 'downhill') {
    const fragments = createDownhill({
      size: section.size,
      inOffset: inSectionOffset,
      steepness: section.steepness,
      steerOffset: state.steerOffset,
    });

    const path = lerpFragments({
      fragments,
      inOffset: inSectionOffset,
    });

    const yOverride = path.left.topY;

    drawObjects({ path, section, yOverride });
    return;
  }

  if (section.kind === 'uphill') {
    const fragments = createUphill({
      size: section.size,
      inOffset: inSectionOffset,
      steepness: section.steepness,
      steerOffset: state.steerOffset,
    });

    const path = lerpFragments({
      fragments,
      inOffset: inSectionOffset,
    });

    const yOverride = path.left.topY;

    drawObjects({ path, section, yOverride });
    return;
  }
}

function getActiveSection() {
  let activeSection: Section = resources.map.sections.find((s) => {
    return state.moveOffset >= s.start && state.moveOffset <= s.start + s.size;
  });
  if (!activeSection || hasSectionEnded(activeSection)) {
    activeSection = { start: state.moveOffset, kind: 'straight', size: 0 };
  }
  return activeSection;
}

function drawObjects({
  path,
  section,
  yOverride,
}: {
  path: Path;
  section: Section;
  yOverride?: number;
}) {
  const { bgOffset, moveOffset, steerOffset } = state;

  // Draw the road stripes full width. Then cut it out and keep the area that is
  // actually covered by the road (the ground area will become transparent
  // again). Do it offscreen because we have to apply another mask and it's hard
  // to do on a single canvas.
  offCtx.globalCompositeOperation = 'source-over';
  drawRoadStripes(offCtx, { moveOffset, yOverride });
  offCtx.globalCompositeOperation = 'destination-in';
  drawRoadMask(offCtx, path, { steerOffset });
  ctx.drawImage(offCanvas, 0, 0);

  // Ditto for the road. Except the curbs are drawn to the main canvas behind
  // the already present road.
  offCtx.globalCompositeOperation = 'source-over';
  drawCurbStripes(offCtx, { moveOffset, yOverride });
  offCtx.globalCompositeOperation = 'destination-in';
  drawCurbMask(offCtx, path, { steerOffset });
  ctx.globalCompositeOperation = 'destination-over';
  ctx.drawImage(offCanvas, 0, 0);

  // Then draw the ground stripes full widths but behind the road - it will keep
  // the road+curbs that were drawn on the previous step and only fill in the
  // ground stripes on the sides.
  ctx.globalCompositeOperation = 'destination-over';
  drawGroundStripes(ctx, { moveOffset, yOverride });

  // Then draw everything on top
  ctx.globalCompositeOperation = 'source-over';

  drawBackground(ctx, {
    bgImage: resources.images.bg2,
    bgOffset,
    yOverride,
  });

  // drawHorizon({ yOverride });
  // drawGrid();

  drawDecors(ctx, {
    decors: resources.map.decors,
    images: resources.images,
    path,
    section,
    moveOffset,
    steerOffset,
    yOverride,
  });

  drawCar(ctx, { images: resources.images, steerOffset });

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
  ctx.setLineDash([]);
  ctx.strokeStyle = '#000';
  ctx.font = '8px serif';

  ctx.strokeText(`move offset: ${state.moveOffset}`, 5, 10);
  ctx.strokeText(`steer: ${state.steerOffset}`, 5, 30);
  ctx.strokeText(`bg: ${state.bgOffset}`, 5, 40);

  const activeSection = getActiveSection();
  ctx.strokeText(`section kind: ${activeSection.kind}`, 5, 20);
}

async function main() {
  resources.images = await loadImages();

  loop();
}

function loop() {
  if (keyboardListener.isDown(InputControl.Up)) {
    state.moveSpeed = MOVE_SPEED;
    state.moveOffset += state.moveSpeed;
  } else if (keyboardListener.isDown(InputControl.Down)) {
    state.moveSpeed = MOVE_SPEED;
    state.moveOffset -= state.moveSpeed;
  } else {
    state.moveSpeed = 0;
  }

  if (keyboardListener.isDown(InputControl.Left)) {
    state.steerSpeed = STEER_SPEED;
    const nextOffset = state.steerOffset + state.steerSpeed;
    state.steerOffset = Math.min(STEER_LIMIT, nextOffset);
  } else if (keyboardListener.isDown(InputControl.Right)) {
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
