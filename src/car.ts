import {
  IW,
  IH,
  RS,
  MOVE_GEARS,
  MOVE_GEAR_MIN,
  MOVE_GEAR_MAX,
  MOVE_ACCELERATION,
  MOVE_DECELERATION_FREE,
  MOVE_DECELERATION_REVERSE,
  MOVE_SPEED_MAX,
  STEER_LIMIT,
  STEER_SPEED,
  STEER_SPEED_IMPROVED,
  STEER_TURN_COUNTER_FORCE,
} from './config';
import { CollisionBox } from './collision';
import { ImageMap } from './images';
import { Pole } from './pole';
import { Section } from './section';
import { Upgrade } from './upgrade';
import { Context2D } from './types';

export function drawCar(
  ctx,
  {
    images,
    steerOffset,
  }: {
    images: ImageMap;
    steerOffset: number;
  },
) {
  const image = images.car;
  const scale = 0.6 * RS;

  const centerX = (IW - image.width * scale) / 2;
  const carSteerOffset = -1 * steerOffset * 0.02;

  const x = centerX + carSteerOffset;
  const y = IH - 70 * RS;

  ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
}

export function getCarBox({
  images,
  roadDepth,
  moveOffset,
  steerOffset,
}: {
  images: ImageMap;
  roadDepth: number;
  moveOffset: number;
  steerOffset: number;
}): CollisionBox {
  const image = images.car;
  const scale = 0.6 * RS;

  const centerX = (IW - image.width * scale) / 2;
  const carSteerOffset = -1 * steerOffset * 0.02;

  const width = image.width * scale;
  const height = image.height * scale;
  const depth = 32;
  const x = centerX + carSteerOffset;
  const y = IH - 70 * RS;
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

export type MoveSpeedState = {
  moveGear: number;
  moveSpeedChange: number;
  moveSpeed: number;
};

export const defaultMoveSpeedState: MoveSpeedState = {
  moveGear: MOVE_GEAR_MIN,
  moveSpeedChange: 0,
  moveSpeed: 0,
};

const POLE_START = 1000;
const POLE_DRIVE = 500;
const POLE_FULL_STOP = 100;

export function updateMoveSpeedState({
  nextPole,
  moveOffset,
  isThrottleActive,
  isReverseActive,
  moveGear: currentMoveGear,
  moveSpeedChange: currentMoveSpeedChange,
  moveSpeed: currentMoveSpeed,
}: {
  nextPole: Pole;
  moveOffset: number;
  isThrottleActive: boolean;
  isReverseActive: boolean;
} & MoveSpeedState): MoveSpeedState {
  let gear = currentMoveGear;
  let speedChange = currentMoveSpeedChange;
  let speed = currentMoveSpeed;

  const gearDesc = MOVE_GEARS[gear];

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

  if (isThrottleActive) {
    if (speedChange < 0) {
      speedChange = 0;
    }
    speedChange = (speedChange + MOVE_ACCELERATION) / gearDesc.delim;
    speed += speedChange;
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
    gear = Math.min(gear + 1, MOVE_GEAR_MAX);
  } else if (speed < gearDesc.startAt) {
    gear = Math.max(gear - 1, MOVE_GEAR_MIN);
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
  isLeftTurnActive,
  isRightTurnActive,
  moveSpeed,
  moveOffset,
}: {
  section: Section;
  upgrades: Upgrade[];
  nextPole: Pole;
  isLeftTurnActive: boolean;
  isRightTurnActive: boolean;
  moveSpeed: number;
  moveOffset: number;
} & SteerState): SteerState {
  let steerOffset = currentSteerOffset;
  let steerSpeed = currentSteerSpeed;

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
    isMuted,
    moveSpeed,
    moveSpeedChange,
    moveGear,
  }: { isMuted: boolean } & MoveSpeedState) {
    const gear = MOVE_GEARS[moveGear];
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
