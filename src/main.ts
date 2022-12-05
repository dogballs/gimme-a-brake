import * as StatsJS from 'stats.js';

// 0: fps, 1: ms, 2: mb, 3+: custom
const stats = new StatsJS();
stats.showPanel(0);
// document.body.appendChild(stats.dom);

import { IW, IH, BW, BH, HH, MULT } from './config';
import { drawCar, getCarBox, updateCarState } from './car';
import { findCollisions, drawCollisionBoxes } from './collision';
import { InputControl, InputController } from './controls';
import { drawBackground, updateBackgroundOffset } from './background';
import { drawDebug, drawHorizon, drawVersion } from './debug';
import { drawDecors } from './decor';
import { updateEndingState, drawEnding } from './ending';
import { loadImages } from './images';
import { drawMenu, updateMenuState } from './menu';
import { GameLoop } from './loop';
import { generateMap } from './map';
import { Path } from './path';
import { drawPoles, getNextPole } from './pole';
import { getPropBoxes, drawProps, PropBox } from './prop';
import { drawCurbMask, drawRoadMask } from './road';
import {
  Section,
  createSectionFragments,
  getActiveSection,
  getNextSection,
} from './section';
import { loadSounds, SoundController } from './sound';
import { SpeedAudio, updateMoveSpeedState, drawSpeedometer } from './speed';
import { createGlobalState, createResetGlobalState } from './state';
import { updateSteerState } from './steer';
import {
  drawCurbStripes,
  drawGroundStripes,
  drawRoadStripes,
  generateStripes,
  stripesUnscaledHeight,
} from './stripes';
import { Zone, getActiveZone, getNextZone, drawZonesRoute } from './zone';
import {
  drawUpgradeDialog,
  drawActiveUpgrades,
  updateUpgradeState,
} from './upgrade';

const loadingElement = document.querySelector<HTMLElement>('[data-loading]');
const crashElement = document.querySelector<HTMLElement>('[data-crash]');

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = IW;
canvas.height = IH;

const FOR_ITCH = false;

function updateCanvasSize() {
  const widthOffset = FOR_ITCH ? 0 : 300;
  const width = window.innerWidth - widthOffset;
  canvas.style.width = `${width}px`;

  if (window.innerHeight < canvas.clientHeight) {
    const width = (window.innerHeight / BH) * BW - widthOffset;
    canvas.style.width = `${width}px`;
  }
}

window.addEventListener('resize', () => {
  updateCanvasSize();
});

let offCanvas;
if (window.OffscreenCanvas) {
  offCanvas = new OffscreenCanvas(IW, IH);
} else {
  offCanvas = document.createElement('canvas');
  offCanvas.width = IW;
  offCanvas.height = IH;
}
const offCtx = offCanvas.getContext('2d');

const inputController = new InputController();

let audioCtx;
function getContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}
const speedAudio = new SpeedAudio(getContext);
const soundController = new SoundController(getContext);

const resources = {
  map: generateMap(),
  images: undefined,
  sounds: undefined,
};

const state = createGlobalState();

const resetGlobalState = createResetGlobalState(state, () => {
  resources.map = generateMap();
});

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

  if (!state.menuState.isOpen && !state.endingState.isCarGone) {
    drawCar(ctx, {
      lastTime,
      images: resources.images,
      upgrades: state.upgradeState.upgrades,
      steerOffset,
      moveOffset,
      state: state.carState,
    });
  }

  if (state.menuState.isOpen && !state.menuState.isAnyKey) {
    drawVersion(ctx);
  }

  if (!state.endingState.isInitiated) {
    drawActiveUpgrades(ctx, {
      lastTime,
      images: resources.images,
      state: state.upgradeState,
    });
  }

  if (!state.menuState.isOpen && !state.endingState.isInitiated) {
    drawSpeedometer(ctx, {
      state: state.speedState,
      upgrades: state.upgradeState.upgrades,
    });

    drawZonesRoute(ctx, {
      images: resources.images,
      zones: resources.map.zones,
      moveOffset,
    });
  }

  if (!state.menuState.isOpen) {
    drawEnding(ctx, {
      images: resources.images,
      state: state.endingState,
    });
  }

  drawUpgradeDialog(ctx, {
    lastTime,
    images: resources.images,
    state: state.upgradeState,
  });

  drawMenu(ctx, {
    lastTime,
    state: state.menuState,
    images: resources.images,
  });

  // drawDebug(ctx, {
  //   section,
  //   moveOffset,
  // });
}

function getInput() {
  const inputMethod = inputController.getActiveMethod();

  const lastPressedThrottleControl = inputMethod.getHoldLastOf([
    InputControl.Up,
    InputControl.Down,
  ]);

  const isThrottleActive = lastPressedThrottleControl === InputControl.Up;
  const isReverseActive = lastPressedThrottleControl === InputControl.Down;

  const lastPressedTurnControl = inputMethod.getHoldLastOf([
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

  state.moveOffsetChange = state.speedState.moveSpeed * MULT();
  state.moveOffset += state.moveOffsetChange;

  state.steerState = updateSteerState({
    section,
    upgrades: state.upgradeState.upgrades,
    nextPole,
    carState: state.carState,
    endingState: state.endingState,
    isLeftTurnActive,
    isRightTurnActive,
    moveSpeed: state.speedState.moveSpeed * MULT(),
    moveOffset: state.moveOffset,
    ...state.steerState,
  });

  state.bgOffset = updateBackgroundOffset({
    section,
    bgOffset: state.bgOffset,
    moveOffset: state.moveOffset,
    moveOffsetChange: state.moveOffsetChange,
    moveSpeed: state.speedState.moveSpeed * 2,
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
  stats.begin();

  inputController.update();

  state.menuState = updateMenuState({
    inputController,
    soundController,
    resetGlobalState,
    state: state.menuState,
    carState: state.carState,
    speedState: state.speedState,
    endingState: state.endingState,
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
    inputController,
    soundController,
    deltaTime,
    state: state.upgradeState,
    nextPole,
    moveOffset: state.moveOffset,
  });

  if (
    !state.menuState.isOpen &&
    !state.upgradeState.isDialogOpen &&
    !state.menuState.isIntro
  ) {
    updateLevelState();
  } else if (state.menuState.isWin) {
    state.moveOffset += state.moveOffsetChange;
  }

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

  state.endingState = updateEndingState({
    inputController,
    soundController,
    deltaTime,
    zone,
    state: state.endingState,
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

  if (!state.menuState.isIntro) {
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
  }

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

  if (!state.menuState.isOpen || state.menuState.isIntro) {
    speedAudio.update({
      menuState: state.menuState,
      upgrades: state.upgradeState.upgrades,
      ...state.speedState,
    });
  }

  stats.end();
}

async function main() {
  try {
    // TODO: parallelize
    loadingElement.textContent = 'Loading images...';
    resources.images = await loadImages();

    loadingElement.textContent = 'Loading sounds...';
    resources.sounds = await loadSounds();

    document.body.appendChild(canvas);
    updateCanvasSize();

    inputController.listen();
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
