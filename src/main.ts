import { IW, IH, HH } from './config';
import { drawCar, getCarBox, updateSteerState, updateCarState } from './car';
import { findCollisions, drawCollisionBoxes } from './collision';
import { InputControl, KeyboardListener } from './controls';
import { drawCurve } from './curve';
import { drawBackground, updateBackgroundOffset } from './background';
import { drawDebug, drawHorizon } from './debug';
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
import { drawMenu, updateMenuState } from './menu';
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
import { loadSounds, SoundController } from './sound';
import { SpeedAudio, updateMoveSpeedState, drawSpeedometer } from './speed';
import { createGlobalState, createResetGlobalState } from './state';
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
  updateUpgradeState,
} from './upgrade';
import { Context2D } from './types';

const loadingElement = document.querySelector<HTMLElement>('[data-loading]');
const crashElement = document.querySelector<HTMLElement>('[data-crash]');

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = IW;
canvas.height = IH;

const offCanvas = new OffscreenCanvas(IW, IH);
const offCtx = offCanvas.getContext('2d');

const keyboardListener = new KeyboardListener(canvas);

const audioCtx = new AudioContext();
const speedAudio = new SpeedAudio(audioCtx);
const soundController = new SoundController(audioCtx);

const resources = {
  map: straightMap,
  images: undefined,
  sounds: undefined,
};

const state = createGlobalState();

const resetGlobalState = createResetGlobalState(state);

const loop = new GameLoop({
  onTick: tick,
});

function draw({
  deltaTime,
  lastTime,
  zone,
  nextZone,
  section,
  path,
  propBoxes,
  yOverride,
}: {
  deltaTime: number;
  lastTime: number;
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

  if (!state.menuState.isOpen) {
    drawProps(ctx, {
      lastTime,
      propBoxes,
      images: resources.images,
      moveOffset,
      steerOffset,
    });
  }

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

  if (!state.menuState.isOpen) {
    drawCar(ctx, {
      images: resources.images,
      upgrades: state.upgradeState.upgrades,
      steerOffset,
      state: state.carState,
    });
  }

  // drawDebug(ctx, {
  //   section,
  //   bgOffset,
  //   moveOffset,
  //   upgrades: state.upgradeState.upgrades,
  //   ...state.speedState,
  //   ...state.steerState,
  // });

  // drawHorizon(ctx);

  drawActiveUpgrades(ctx, {
    images: resources.images,
    state: state.upgradeState,
  });

  if (!state.menuState.isOpen) {
    drawSpeedometer(ctx, {
      state: state.speedState,
      upgrades: state.upgradeState.upgrades,
    });
  }

  drawUpgradeDialog(ctx, {
    images: resources.images,
    state: state.upgradeState,
  });

  drawMenu(ctx, {
    lastTime,
    state: state.menuState,
    images: resources.images,
  });

  // drawCurve(ctx, path.left, {
  //   moveOffset: state.moveOffset,
  //   steerOffset: state.steerState.steerOffset,
  // });
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

  if (state.menuState.isOpen) {
    return;
  }
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
    section,
    nextPole,
    upgrades: state.upgradeState.upgrades,
    carState: state.carState,
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
    carState: state.carState,
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
    soundController,
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
    // collidedBoxes.push(carBox);
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

function tick({
  deltaTime,
  lastTime,
}: {
  deltaTime: number;
  lastTime: number;
}) {
  keyboardListener.update();

  state.menuState = updateMenuState({
    keyboardListener,
    soundController,
    resetGlobalState,
    state: state.menuState,
    carState: state.carState,
    speedState: state.speedState,
    deltaTime,
  });

  soundController.setGlobalMuted(!state.menuState.isSoundOn);

  // Don't continue state updates if it was reset in the menu
  if (state.gotReset) {
    state.gotReset = false;
    return;
  }

  // NOTE: Don't destructure until after all state updates

  const nextPole = getNextPole({
    poles: resources.map.poles,
    moveOffset: state.moveOffset,
  });

  state.upgradeState = updateUpgradeState({
    keyboardListener,
    soundController,
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
    soundController,
    path,
    state: state.carState,
    stripes,
    upgrades: state.upgradeState.upgrades,
    carBox,
    collidedBoxes,
    deltaTime,
    steerOffset: state.steerState.steerOffset,
  });

  draw({
    deltaTime,
    lastTime,
    zone,
    nextZone,
    section,
    path,
    yOverride,
    propBoxes,
  });

  // drawCollisionBoxes(ctx, collidedBoxes, uncollidedBoxes, {
  //   stripes,
  //   roadDepth,
  // });

  if (!state.menuState.isOpen) {
    if (state.menuState.isSoundOn) {
      audioCtx.resume();
    } else {
      audioCtx.suspend();
    }
    speedAudio.update({
      upgrades: state.upgradeState.upgrades,
      ...state.speedState,
    });
  }
}

async function main() {
  try {
    // TODO: parallelize
    loadingElement.textContent = 'Loading images...';
    resources.images = await loadImages();

    loadingElement.textContent = 'Loading sounds...';
    resources.sounds = await loadSounds();

    document.body.appendChild(canvas);

    keyboardListener.listen();
    soundController.sounds = resources.sounds;

    loop.start();
  } catch (err) {
    crash();

    console.error(err);
  } finally {
    loadingElement.style.display = 'none';
  }
}

function crash() {
  loop.stop();
  try {
    document.body.removeChild(canvas);
  } catch (err) {}
  crashElement.style.display = 'flex';
}

main();
