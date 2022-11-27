import {
  POLE_START,
  POLE_DRIVE,
  POLE_FULL_STOP,
  STEER_SPEED,
  STEER_SPEED_IMPROVED,
  STEER_LIMIT,
  STEER_TURN_COUNTER_FORCE,
  MOVE_SPEED_MAX,
} from './config';

import { CarState } from './car';
import { EndingState } from './ending';
import { Section } from './section';
import { Pole } from './pole';
import { Upgrade } from './upgrade';

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
  endingState,
  isLeftTurnActive,
  isRightTurnActive,
  moveSpeed,
  moveOffset,
}: {
  section: Section;
  upgrades: Upgrade[];
  nextPole: Pole | undefined;
  carState: CarState;
  endingState: EndingState;
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

  if (endingState.isInitiated) {
    let speed = 2;
    if (steerOffset > 0) {
      steerSpeed = -speed;
      steerOffset = Math.max(0, steerOffset + steerSpeed);
    }
    if (steerOffset < 0) {
      steerSpeed = speed;
      steerOffset = Math.min(0, steerOffset + speed);
    }
    if (steerOffset === 0) {
      endingState.isSteerDone = true;
    }
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
