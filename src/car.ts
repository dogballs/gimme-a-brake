import {
  IW,
  IH,
  HW,
  HH,
  RS,
  MOVE_ACCELERATION,
  MOVE_DECELERATION_FREE,
  MOVE_DECELERATION_REVERSE,
  MOVE_DECELERATION_UPGRADE,
  MOVE_SPEED_MAX,
  MOVE_SPEED_MAX_UPGRADE,
  STEER_LIMIT,
  STEER_SPEED,
  STEER_SPEED_IMPROVED,
  STEER_TURN_COUNTER_FORCE,
} from './config';
import { CollisionBox } from './collision';
import { curveXByY, steerCurve } from './curve';
import { ImageMap } from './images';
import { Path } from './path';
import { Pole } from './pole';
import { Section } from './section';
import { Stripe, stripesToY } from './stripes';
import { Upgrade } from './upgrade';
import { Context2D } from './types';

export function drawCar(
  ctx,
  {
    images,
    upgrades,
    steerOffset,
    state,
  }: {
    images: ImageMap;
    upgrades: Upgrade[];
    steerOffset: number;
    state: CarState;
  },
) {
  const image = images.car;
  const scale = 0.7 * RS;

  const carWidth = image.width * scale;
  const carHeight = image.height * scale;

  const centerX = (IW - carWidth) / 2;
  const carSteerOffset = -1 * steerOffset * 0.02;

  let x = centerX + carSteerOffset;
  let y = IH - 78 * RS;

  if (state.curbTimePassed > 0 && state.flipTimePassed === 0) {
    if (state.curbFrameIndex % 5 === 0) {
      y += 3;
      x += 2;
    } else if (state.curbFrameIndex % 10 === 0) {
      y += 5;
      x -= 2;
    }
  }

  if (state.flipTimePassed > 0) {
    let angle = 0;
    if (state.flipTimePassed > 0.3) {
      angle = -90;
    }
    if (state.flipTimePassed > 0.9) {
      angle = -180;
    }

    let yOffset = 0;
    if (state.flipTimePassed > 0) {
      yOffset = -10;
    }
    if (state.flipTimePassed > 0.3) {
      yOffset = 0;
    }
    if (state.flipTimePassed > 0.6) {
      yOffset = -10;
    }
    if (state.flipTimePassed > 0.9) {
      yOffset = 0;
    }
    if (state.flipTimePassed > 1.2) {
      yOffset = -5;
    }
    if (state.flipTimePassed > 1.5) {
      yOffset = 0;
    }
    if (state.flipTimePassed > 1.6) {
      yOffset = -5;
    }
    if (state.flipTimePassed > 1.7) {
      yOffset = 0;
    }
    if (state.flipTimePassed > 1.8) {
      yOffset = -5;
    }
    if (state.flipTimePassed > 1.9) {
      yOffset = 0;
    }

    y += yOffset;

    const angleInRadians = (Math.PI / 180) * angle;

    ctx.translate(x + carWidth / 2, y + carHeight / 2);
    ctx.rotate(angleInRadians);

    ctx.drawImage(image, -carWidth / 2, -carHeight / 2, carWidth, carHeight);

    ctx.rotate(-angleInRadians);
    ctx.translate(-x - carWidth / 2, -y - carHeight / 2);
  } else {
    ctx.drawImage(image, x, y, carWidth, carHeight);
    ctx.globalAlpha = 1;

    if (state.curbTimePassed > 0) {
      const hasCurbStopUpgrade = upgrades.some((u) => u.kind === 'curb-stop');
      const allowedTime = hasCurbStopUpgrade
        ? CURB_ALLOWED_TIME_UPGRADE
        : CURB_ALLOWED_TIME;

      const displayTime = (allowedTime - state.curbTimePassed).toFixed(1);

      ctx.strokeStyle = '#d78a35';
      ctx.lineWidth = 1;
      ctx.font = '8px serif';
      ctx.strokeText(displayTime, x + carWidth / 2 - 4, y + carHeight / 2 + 10);
    }
  }
}

export function getCarBox({
  images,
  steerOffset,
}: {
  images: ImageMap;
  steerOffset: number;
}): CollisionBox {
  const image = images.car;
  const scale = 0.7 * RS;

  const centerX = (IW - image.width * scale) / 2;
  const carSteerOffset = -1 * steerOffset * 0.02;

  const width = image.width * scale;
  const height = image.height * scale;
  const depth = 32;
  const x = centerX + carSteerOffset;
  const y = IH - 78 * RS;
  const z = 16;

  return {
    x,
    y,
    z,
    width,
    height,
    depth,
  };
}

function getMoveGears({ upgrades }: { upgrades: Upgrade[] }) {
  const hasUpgrade = upgrades.some((u) => u.kind === 'lower-max-speed');
  const speedMax = hasUpgrade ? MOVE_SPEED_MAX_UPGRADE : MOVE_SPEED_MAX;

  return {
    1: { delim: 4, startAt: 0, endAt: 1.1 },
    2: { delim: 5, startAt: 1, endAt: 2.6 },
    3: { delim: 6, startAt: 2.5, endAt: 4.1 },
    4: { delim: 7, startAt: 4, endAt: 6.1 },
    5: { delim: 8, startAt: 6, endAt: speedMax },
  };
}

function getGearMin() {
  return 1;
}

function getGearMax() {
  return 5;
}

const CURB_ALLOWED_OVERFLOW = 20;
const CURB_ALLOWED_TIME = 2;
const CURB_ALLOWED_TIME_UPGRADE = 4;

export type CarState = {
  curbTimePassed: number;
  curbFrameIndex: number;
  flipTimePassed: number;
};

export const defaultCarState: CarState = {
  curbTimePassed: 0,
  curbFrameIndex: 0,
  flipTimePassed: 0,
};

export function updateCarState({
  path,
  state,
  stripes,
  upgrades,
  carBox,
  deltaTime,
  steerOffset,
}: {
  path: Path;
  state: CarState;
  stripes: Stripe[];
  upgrades: Upgrade[];
  carBox: CollisionBox;
  deltaTime: number;
  steerOffset: number;
}): CarState {
  let curbTimePassed = state.curbTimePassed;
  let curbFrameIndex = state.curbFrameIndex;
  let flipTimePassed = state.flipTimePassed;

  if (flipTimePassed > 0) {
    flipTimePassed += deltaTime;
    curbFrameIndex = curbFrameIndex + 1;
    return {
      curbTimePassed,
      curbFrameIndex,
      flipTimePassed,
    };
  }

  const leftCurbX = curveXByY(
    steerCurve(path.left, { steerOffset }),
    carBox.y + carBox.height,
  );
  const rightCurbX = curveXByY(
    steerCurve(path.right, { steerOffset }),
    carBox.y + carBox.height,
  );

  const isTouchingLeftCurb = leftCurbX - CURB_ALLOWED_OVERFLOW > carBox.x;
  const isTouchingRightCurb =
    rightCurbX + CURB_ALLOWED_OVERFLOW < carBox.x + carBox.width;

  const hasCurbStopUpgrade = upgrades.some(
    (u) => u.kind === 'curb-stop' && u.cooldownPassed == null,
  );

  if (isTouchingLeftCurb || isTouchingRightCurb) {
    curbTimePassed += deltaTime;
    curbFrameIndex = curbFrameIndex + 1;

    const allowedTime = hasCurbStopUpgrade
      ? CURB_ALLOWED_TIME_UPGRADE
      : CURB_ALLOWED_TIME;

    if (curbTimePassed > allowedTime) {
      flipTimePassed += deltaTime;
    }
  } else {
    curbTimePassed = 0;
    curbFrameIndex = 0;
  }

  return {
    curbTimePassed,
    curbFrameIndex,
    flipTimePassed,
  };
}

export type MoveSpeedState = {
  moveGear: number;
  moveSpeedChange: number;
  moveSpeed: number;
};

export const defaultMoveSpeedState: MoveSpeedState = {
  moveGear: getGearMin(),
  moveSpeedChange: 0,
  moveSpeed: 0,
};

const POLE_START = 1000;
const POLE_DRIVE = 500;
const POLE_FULL_STOP = 100;

export function updateMoveSpeedState({
  section,
  nextPole,
  carState,
  upgrades,
  moveOffset,
  // isThrottleActive,
  // isReverseActive,
  moveGear: currentMoveGear,
  moveSpeedChange: currentMoveSpeedChange,
  moveSpeed: currentMoveSpeed,
}: {
  section: Section;
  nextPole: Pole | undefined;
  carState: CarState;
  upgrades: Upgrade[];
  moveOffset: number;
  // isThrottleActive: boolean;
  // isReverseActive: boolean;
} & MoveSpeedState): MoveSpeedState {
  // Story mode - forced acceleration, no brakes
  const isThrottleActive = true;
  const isReverseActive = false;

  let gear = currentMoveGear;
  let speedChange = currentMoveSpeedChange;
  let speed = currentMoveSpeed;

  const gearDesc = getMoveGears({ upgrades })[gear];

  if (carState.flipTimePassed > 0) {
    speedChange = (speedChange - MOVE_DECELERATION_REVERSE) / gearDesc.delim;
    speed = Math.max(0, speed + speedChange);
    return {
      moveGear: gear,
      moveSpeedChange: speedChange,
      moveSpeed: speed,
    };
  }

  if (nextPole) {
    const toPole = nextPole.start - moveOffset;
    if (toPole < POLE_START) {
      speedChange = (speedChange - MOVE_DECELERATION_FREE) / gearDesc.delim;
      speed = Math.max(3, speed + speedChange);

      if (toPole < POLE_DRIVE) {
        speedChange = 0;
        speed = 1.5;
      }

      if (toPole < POLE_FULL_STOP) {
        speedChange = -100;
        speed = Math.max(0, speed + speedChange);
        setTimeout(() => {
          nextPole.arrived = true;
        }, 100);
      }

      return {
        moveGear: gear,
        moveSpeedChange: speedChange,
        moveSpeed: speed,
      };
    }
  }

  const curbStopUpgrade = upgrades.find(
    (u) => u.kind === 'curb-stop' && u.cooldownPassed == null,
  );
  if (curbStopUpgrade && carState.curbTimePassed > 0) {
    // curbStopUpgrade.cooldownPassed = 0;
    // tODO: doesnot work
    speedChange = (speedChange - MOVE_DECELERATION_REVERSE) / gearDesc.delim;
    speed = Math.max(2, speed + speedChange);
  } else if (isThrottleActive) {
    if (speedChange < 0) {
      speedChange = 0;
    }
    const hasUphillSlowUpgrade = upgrades.some(
      (u) => u.kind === 'turn-uphill-slow',
    );
    const hasSection = ['turn-left', 'turn-right', 'uphill'].includes(
      section.kind,
    );
    if (hasUphillSlowUpgrade && hasSection) {
      // Slows down and drops to certain speed with an upgrade
      speedChange = (speedChange - MOVE_DECELERATION_UPGRADE) / gearDesc.delim;
      speed = Math.max(3, speed + speedChange);
    } else {
      // Default acceleration
      speedChange = (speedChange + MOVE_ACCELERATION) / gearDesc.delim;
      speed = Math.max(0, speed + speedChange);
    }
  } else {
    if (speed > 0) {
      if (isReverseActive) {
        speedChange =
          (speedChange - MOVE_DECELERATION_REVERSE) / gearDesc.delim;
        speed = Math.max(0, speed + speedChange);
      } else {
        speedChange = (speedChange - MOVE_DECELERATION_FREE) / gearDesc.delim;
        speed = Math.max(0, speed + speedChange);
      }
    }
  }

  if (speed > gearDesc.endAt) {
    gear = Math.min(gear + 1, getGearMax());
  } else if (speed < gearDesc.startAt) {
    gear = Math.max(gear - 1, getGearMin());
  }

  speed = Math.min(speed, gearDesc.endAt);

  return {
    moveGear: gear,
    moveSpeedChange: speedChange,
    moveSpeed: speed,
  };
}

export type SteerState = {
  steerOffset: number;
  steerSpeed: number;
};

export const defaultSteerState: SteerState = {
  steerOffset: 0,
  steerSpeed: 0,
};

const STEER_REDUCE_TILL_SPEED = 3;

export function updateSteerState({
  steerOffset: currentSteerOffset,
  steerSpeed: currentSteerSpeed,
  section,
  upgrades,
  nextPole,
  carState,
  isLeftTurnActive,
  isRightTurnActive,
  moveSpeed,
  moveOffset,
}: {
  section: Section;
  upgrades: Upgrade[];
  nextPole: Pole | undefined;
  carState: CarState;
  isLeftTurnActive: boolean;
  isRightTurnActive: boolean;
  moveSpeed: number;
  moveOffset: number;
} & SteerState): SteerState {
  let steerOffset = currentSteerOffset;
  let steerSpeed = currentSteerSpeed;

  if (carState.flipTimePassed > 0) {
    return {
      steerSpeed,
      steerOffset,
    };
  }

  if (nextPole) {
    const toPole = nextPole.start - moveOffset;
    if (toPole < POLE_START) {
      let speed = 2;
      if (toPole < POLE_DRIVE) {
        speed = 5;
      }
      if (toPole < POLE_FULL_STOP) {
        speed = 100;
      }

      if (steerOffset > 0) {
        steerSpeed = -speed;
        steerOffset = Math.max(0, steerOffset + steerSpeed);
      }
      if (steerOffset < 0) {
        steerSpeed = speed;
        steerOffset = Math.min(0, steerOffset + speed);
      }

      return {
        steerSpeed,
        steerOffset,
      };
    }
  }

  if (moveSpeed >= 0) {
    let t = 1;
    if (moveSpeed < STEER_REDUCE_TILL_SPEED) {
      t = moveSpeed / STEER_REDUCE_TILL_SPEED;
    }
    let baseSteerSpeed = STEER_SPEED;
    if (upgrades.some((u) => u.kind === 'improved-steering')) {
      baseSteerSpeed = STEER_SPEED_IMPROVED;
    }
    const steerSpeed = baseSteerSpeed * t;
    if (isLeftTurnActive) {
      steerOffset = Math.min(STEER_LIMIT, steerOffset + steerSpeed);
    } else if (isRightTurnActive) {
      steerOffset = Math.max(-STEER_LIMIT, steerOffset - steerSpeed);
    }
  } else {
    steerSpeed = 0;
  }

  // The faster the car is going - turn will generate more counter-force
  const turnCounterForce =
    STEER_TURN_COUNTER_FORCE * (moveSpeed / MOVE_SPEED_MAX);
  if (section.kind === 'turn-left') {
    steerOffset -= turnCounterForce;
  } else if (section.kind === 'turn-right') {
    steerOffset += turnCounterForce;
  }

  return {
    steerSpeed,
    steerOffset,
  };
}

export class MoveAudio {
  private readonly osc: OscillatorNode;
  private isMuted: boolean = true;

  constructor(audioCtx: AudioContext) {
    this.osc = audioCtx.createOscillator();
    this.osc.type = 'sawtooth';

    const biquadFilter = audioCtx.createBiquadFilter();

    this.osc.connect(biquadFilter);
    this.osc.start();

    biquadFilter.connect(audioCtx.destination);
  }

  update({
    upgrades,
    isMuted,
    moveSpeed,
    moveSpeedChange,
    moveGear,
  }: { upgrades: Upgrade[]; isMuted: boolean } & MoveSpeedState) {
    const gear = getMoveGears({ upgrades })[moveGear];
    const gearT = (moveSpeed - gear.startAt) / (gear.endAt - gear.startAt);

    let soundStart = 30 + moveGear * 10;
    let soundEnd = soundStart + moveGear * 15;
    if (moveSpeedChange < 0) {
      soundEnd = soundStart + moveGear * 8;
    }

    const soundValue = soundStart + (soundEnd - soundStart) * gearT;

    this.osc.frequency.value = soundValue;
  }
}
