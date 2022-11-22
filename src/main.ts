import { IW, IH, HH } from './config';
import {
  drawCar,
  getCarBox,
  defaultSteerState,
  defaultMoveSpeedState,
  defaultCarState,
  updateMoveSpeedState,
  updateSteerState,
  MoveSpeedState,
  SteerState,
  MoveAudio,
  CarState,
  updateCarState,
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
import { GameLoop } from './loop';
import { straightMap, coolMap, longLeftTurnMap, longUphillMap } from './map';
import { Path } from './path';
import { drawPoles, getNextPole } from './pole';
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
import {
  drawUpgradeDialog,
  drawActiveUpgrades,
  defaultUpgradeState,
  UpgradeState,
  updateUpgradeState,
} from './upgrade';
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
  upgradeState: UpgradeState;
  carState: CarState;
  moveOffset: number;
  moveOffsetChange: number;
  bgOffset: number;
} = {
  speedState: defaultMoveSpeedState,
  steerState: defaultSteerState,
  upgradeState: defaultUpgradeState,
  carState: defaultCarState,
  moveOffset: 0,
  moveOffsetChange: 0,
  bgOffset: 0,
};

const loop = new GameLoop({
  onTick: tick,
});

logClientCoordsOnClick(canvas);

function draw({
  deltaTime,
  zone,
  nextZone,
  section,
  path,
  propBoxes,
  yOverride,
}: {
  deltaTime: number;
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

  drawPoles(ctx, {
    images: resources.images,
    poles: resources.map.poles,
    deltaTime,
    path,
    zone,
    nextZone,
    moveOffset,
    steerOffset,
    yOverride,
  });

  drawCar(ctx, {
    images: resources.images,
    steerOffset,
    state: state.carState,
  });

  drawDebug(ctx, {
    section,
    bgOffset,
    moveOffset,
    upgrades: state.upgradeState.upgrades,
    ...state.speedState,
    ...state.steerState,
  });

  // drawHorizon(ctx);

  drawActiveUpgrades(ctx, {
    images: resources.images,
    state: state.upgradeState,
  });

  drawUpgradeDialog(ctx, {
    images: resources.images,
    state: state.upgradeState,
  });

  // drawCurve(ctx, path.left, {
  //   moveOffset: state.moveOffset,
  //   steerOffset: state.steerState.steerOffset,
  // });
}

async function main() {
  resources.images = await loadImages();

  loop.start();
}

function getInput() {
  const isUp = keyboardListener.isHold(InputControl.Up);
  const isDown = keyboardListener.isHold(InputControl.Down);

  const lastPressedThrottleControl = keyboardListener.getHoldLastOf([
    InputControl.Up,
    InputControl.Down,
  ]);

  const isThrottleActive = lastPressedThrottleControl === InputControl.Up;
  const isReverseActive = lastPressedThrottleControl === InputControl.Down;

  const lastPressedTurnControl = keyboardListener.getHoldLastOf([
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

function updateLevelState() {
  // NOTE: don't destructure the state here because it is constantly updated

  if (state.upgradeState.isDialogOpen) {
    return;
  }

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

  const nextPole = getNextPole({
    poles: resources.map.poles,
    moveOffset: state.moveOffset,
  });

  state.speedState = updateMoveSpeedState({
    nextPole,
    moveOffset: state.moveOffset,
    isThrottleActive,
    isReverseActive,
    ...state.speedState,
  });

  state.moveOffsetChange = state.speedState.moveSpeed;
  state.moveOffset += state.moveOffsetChange;

  state.steerState = updateSteerState({
    section,
    upgrades: state.upgradeState.upgrades,
    nextPole,
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
    carBox,
    propBoxes,
  };
}

function tick({ deltaTime }: { deltaTime: number }) {
  keyboardListener.update();

  // NOTE: Don't destructure until after all state updates

  const nextPole = getNextPole({
    poles: resources.map.poles,
    moveOffset: state.moveOffset,
  });

  state.upgradeState = updateUpgradeState({
    keyboardListener,
    deltaTime,
    state: state.upgradeState,
    nextPole,
    moveOffset: state.moveOffset,
  });

  updateLevelState();

  const section = getActiveSection({
    sections: resources.map.sections,
    moveOffset: state.moveOffset,
  });
  const nextSection = getNextSection({
    sections: resources.map.sections,
    moveOffset: state.moveOffset,
  });

  const zone = getActiveZone({
    zones: resources.map.zones,
    moveOffset: state.moveOffset,
  });
  const nextZone = getNextZone({
    zones: resources.map.zones,
    moveOffset: state.moveOffset,
  });

  const { path, yOverride } = createSectionFragments({
    section,
    moveOffset: state.moveOffset,
    steerOffset: state.steerState.steerOffset,
  });

  let roadHeight = IH - (yOverride ?? HH);
  const stripes = generateStripes({ roadHeight });
  const roadDepth = stripesUnscaledHeight(stripes);

  const { collidedBoxes, uncollidedBoxes, carBox, propBoxes } =
    updateCollisions({
      section,
      nextSection,
      path,
      roadDepth,
      yOverride,
    });

  state.carState = updateCarState({
    path,
    state: state.carState,
    stripes,
    carBox,
    deltaTime,
    steerOffset: state.steerState.steerOffset,
  });

  draw({ deltaTime, zone, nextZone, section, path, yOverride, propBoxes });

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
}

main();
