import { IW, IH, HH } from './config';
import {
  drawCar,
  getCarBox,
  defaultSteerState,
  defaultMoveSpeedState,
  updateMoveSpeedState,
  updateSteerState,
  MoveSpeedState,
  SteerState,
  MoveAudio,
} from './car';
import { findCollisions, drawCollisionBoxes } from './collision';
import { InputControl, listenKeyboard } from './controls';
import { drawCurve } from './curve';
import { drawBackground, updateBackgroundOffset } from './background';
import { drawDebug, drawHorizon, logClientCoordsOnClick } from './debug';
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
import { getPropBoxes, drawProps, PropBox } from './prop';
import { drawCurbMask, drawRoadMask, drawRoadLines } from './road';
import {
  Section,
  createSectionFragments,
  getActiveSection,
  getNextSection,
} from './section';
import {
  Stripe,
  drawCurbStripes,
  drawGroundStripes,
  drawRoadStripes,
  generateStripes,
  stripesUnscaledHeight,
} from './stripes';
import { Zone, getActiveZone, getNextZone } from './zone';
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
  moveOffsetChange: number;
  bgOffset: number;
} = {
  speedState: defaultMoveSpeedState,
  steerState: defaultSteerState,
  moveOffset: 0,
  moveOffsetChange: 0,
  bgOffset: 0,
};

logClientCoordsOnClick(canvas);

function draw({
  zone,
  nextZone,
  section,
  path,
  propBoxes,
  yOverride,
}: {
  zone: Zone;
  nextZone: Zone;
  section: Section;
  path: Path;
  propBoxes: PropBox[];
  yOverride?: number;
}) {
  ctx.clearRect(0, 0, IW, IH);

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
  drawRoadStripes(offCtx, { zone, nextZone, moveOffset, yOverride });
  offCtx.globalCompositeOperation = 'destination-in';
  drawRoadMask(offCtx, path, { steerOffset });
  ctx.drawImage(offCanvas, 0, 0);

  // Ditto for the road. Except the curbs are drawn to the main canvas behind
  // the already present road.
  offCtx.globalCompositeOperation = 'source-over';
  drawCurbStripes(offCtx, { zone, nextZone, moveOffset, yOverride });
  offCtx.globalCompositeOperation = 'destination-in';
  drawCurbMask(offCtx, path, { steerOffset });
  ctx.globalCompositeOperation = 'destination-over';
  ctx.drawImage(offCanvas, 0, 0);

  // Then draw the ground stripes full widths but behind the road - it will keep
  // the road+curbs that were drawn on the previous step and only fill in the
  // ground stripes on the sides.
  ctx.globalCompositeOperation = 'destination-over';
  drawGroundStripes(ctx, { zone, nextZone, moveOffset, yOverride });

  // Then draw everything on top
  ctx.globalCompositeOperation = 'source-over';

  drawBackground(ctx, {
    images: resources.images,
    zone,
    nextZone,
    moveOffset,
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

  drawProps(ctx, {
    propBoxes,
    images: resources.images,
    moveOffset,
    steerOffset,
  });

  drawCar(ctx, { images: resources.images, steerOffset });

  drawDebug(ctx, {
    section,
    bgOffset,
    moveOffset,
    ...state.speedState,
    ...state.steerState,
  });

  // drawHorizon(ctx);
}

async function main() {
  resources.images = await loadImages();

  loop();
}

function getInput() {
  const isUp = keyboardListener.isDown(InputControl.Up);
  const isDown = keyboardListener.isDown(InputControl.Down);

  const lastPressedThrottleControl = keyboardListener.getDownLastOf([
    InputControl.Up,
    InputControl.Down,
  ]);

  const isThrottleActive = lastPressedThrottleControl === InputControl.Up;
  const isReverseActive = lastPressedThrottleControl === InputControl.Down;

  const lastPressedTurnControl = keyboardListener.getDownLastOf([
    InputControl.Left,
    InputControl.Right,
  ]);

  const isLeftTurnActive = lastPressedTurnControl === InputControl.Left;
  const isRightTurnActive = lastPressedTurnControl === InputControl.Right;

  return {
    isThrottleActive,
    isReverseActive,
    isRightTurnActive,
    isLeftTurnActive,
  };
}

function updateState() {
  // NOTE: don't destructure the state here because it is constantly updated

  const {
    isThrottleActive,
    isReverseActive,
    isRightTurnActive,
    isLeftTurnActive,
  } = getInput();

  const section = getActiveSection({
    sections: resources.map.sections,
    moveOffset: state.moveOffset,
  });

  state.speedState = updateMoveSpeedState({
    isThrottleActive,
    isReverseActive,
    ...state.speedState,
  });

  state.moveOffsetChange = state.speedState.moveSpeed;
  state.moveOffset += state.moveOffsetChange;

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
    moveOffsetChange: state.moveOffsetChange,
    moveSpeed: state.speedState.moveSpeed,
  });
}

function updateCollisions({
  path,
  section,
  nextSection,
  roadDepth,
  yOverride,
}: {
  path: Path;
  section: Section;
  nextSection: Section | undefined;
  roadDepth: number;
  yOverride?: number;
}) {
  const carBox = getCarBox({
    images: resources.images,
    roadDepth,
    moveOffset: state.moveOffset,
    steerOffset: state.steerState.steerOffset,
  });

  const propBoxes = getPropBoxes({
    props: resources.map.props,
    images: resources.images,
    path,
    section,
    nextSection,
    moveOffset: state.moveOffset,
    steerOffset: state.steerState.steerOffset,
    yOverride,
  });

  const collidedBoxes = [];
  const uncollidedBoxes = [];

  const targetIndexes = findCollisions(carBox, propBoxes);
  if (targetIndexes.length > 0) {
    collidedBoxes.push(carBox);
    collidedBoxes.push(...targetIndexes.map((index) => propBoxes[index]));
  } else {
    uncollidedBoxes.push(carBox, ...propBoxes);
  }

  return {
    collidedBoxes,
    uncollidedBoxes,
    propBoxes,
  };
}

function loop() {
  updateState();

  const {
    map: { sections, zones },
  } = resources;

  const {
    moveOffset,
    steerState: { steerOffset },
  } = state;

  const section = getActiveSection({ sections, moveOffset });
  const nextSection = getNextSection({ sections, moveOffset });

  const zone = getActiveZone({ zones, moveOffset });
  const nextZone = getNextZone({ zones, moveOffset });

  const { path, yOverride } = createSectionFragments({
    section,
    moveOffset,
    steerOffset,
  });

  let roadHeight = IH - (yOverride ?? HH);
  const stripes = generateStripes({ roadHeight });
  const roadDepth = stripesUnscaledHeight(stripes);

  const { collidedBoxes, uncollidedBoxes, propBoxes } = updateCollisions({
    section,
    nextSection,
    path,
    roadDepth,
    yOverride,
  });

  draw({ zone, nextZone, section, path, yOverride, propBoxes });

  // drawCollisionBoxes(ctx, collidedBoxes, uncollidedBoxes, {
  //   stripes,
  //   roadDepth,
  // });

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
