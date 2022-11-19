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
  STEER_TURN_COUNTER_FORCE,
} from './config';
import { CollisionBox } from './collision';
import { ImageMap } from './images';
import { Section } from './section';
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

export function updateMoveSpeedState({
  isThrottleActive,
  isReverseActive,
  moveGear: currentMoveGear,
  moveSpeedChange: currentMoveSpeedChange,
  moveSpeed: currentMoveSpeed,
}: {
  isThrottleActive: boolean;
  isReverseActive: boolean;
} & MoveSpeedState): MoveSpeedState {
  let gear = currentMoveGear;
  let speedChange = currentMoveSpeedChange;
  let speed = currentMoveSpeed;

  const gearDesc = MOVE_GEARS[gear];

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
  isLeftTurnActive,
  isRightTurnActive,
  moveSpeed,
  moveOffset,
}: {
  section: Section;
  isLeftTurnActive: boolean;
  isRightTurnActive: boolean;
  moveSpeed: number;
  moveOffset: number;
} & SteerState): SteerState {
  let steerOffset = currentSteerOffset;
  let steerSpeed = currentSteerSpeed;

  const inSectionOffset = moveOffset - section.start;

  if (moveSpeed >= 0) {
    let t = 1;
    if (moveSpeed < STEER_REDUCE_TILL_SPEED) {
      t = moveSpeed / STEER_REDUCE_TILL_SPEED;
    }
    const steerSpeed = STEER_SPEED * t;
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
