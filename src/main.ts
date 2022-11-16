import { IW, IH } from './config';
import {
  drawCar,
  defaultSteerState,
  defaultMoveSpeedState,
  updateMoveSpeedState,
  updateSteerState,
  MoveSpeedState,
  SteerState,
  MoveAudio,
} from './car';
import { InputControl, listenKeyboard } from './controls';
import { drawCurve } from './curve';
import { drawBackground, updateBackgroundOffset } from './background';
import { drawDebug } from './debug';
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

const keyboardListener = listenKeyboard();

const muteControl = document.querySelector<HTMLInputElement>(
  '[data-control="mute"]',
);
const audioCtx = new AudioContext();
const moveAudio = new MoveAudio(audioCtx);

const resources = {
  map: coolMap,
  images: undefined,
};

const state: {
  speedState: MoveSpeedState;
  steerState: SteerState;
  moveOffset: number;
  bgOffset: number;
} = {
  speedState: defaultMoveSpeedState,
  steerState: defaultSteerState,
  moveOffset: 0,
  bgOffset: 0,
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
    const fragments = createTurn({
      size: section.size,
      direction: section.kind === 'turn-right' ? 'right' : 'left',
      steerOffset: state.steerState.steerOffset,
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
      steerOffset: state.steerState.steerOffset,
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
      steerOffset: state.steerState.steerOffset,
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
  const {
    bgOffset,
    moveOffset,
    steerState: { steerOffset },
  } = state;

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

  drawDebug(ctx, {
    section,
    bgOffset,
    moveOffset,
    ...state.speedState,
    ...state.steerState,
  });
}
function hasSectionEnded(section: Section) {
  return section.start + section.size < state.moveOffset;
}

async function main() {
  resources.images = await loadImages();

  loop();
}

function loop() {
  // NOTE: don't destructure the state here because it is constantly updated

  const section = getActiveSection();

  const isThrottleActive = keyboardListener.isDown(InputControl.Up);
  const isLeftTurnActive = keyboardListener.isDown(InputControl.Left);
  const isRightTurnActive = keyboardListener.isDown(InputControl.Right);

  state.speedState = updateMoveSpeedState({
    isThrottleActive,
    ...state.speedState,
  });

  state.moveOffset += state.speedState.moveSpeed;

  state.steerState = updateSteerState({
    section,
    isLeftTurnActive,
    isRightTurnActive,
    moveSpeed: state.speedState.moveSpeed,
    moveOffset: state.moveOffset,
    ...state.steerState,
  });

  state.bgOffset = updateBackgroundOffset({
    section,
    bgOffset: state.bgOffset,
    moveOffset: state.moveOffset,
  });

  draw();

  const isMuted = !muteControl.checked;
  if (isMuted && audioCtx.state === 'running') {
    audioCtx.suspend();
  } else if (!isMuted && audioCtx.state !== 'running') {
    audioCtx.resume();
  }

  moveAudio.update({ isMuted, ...state.speedState });

  requestAnimationFrame(loop);
}

main();
