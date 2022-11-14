import {
  IW,
  IH,
  RENDER_SCALE,
  MOVE_GEARS,
  MOVE_ACCELERATION,
  MOVE_DECELERATION,
} from './config';
import { ImageMap } from './images';
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
  const scale = 0.6 * RENDER_SCALE;

  const centerX = (IW - image.width * scale) / 2;
  const carSteerOffset = -1 * steerOffset * 0.02;

  const x = centerX + carSteerOffset;
  const y = IH - 70 * RENDER_SCALE;

  ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
}

export type MoveSpeedState = {
  gear: number;
  speedChange: number;
  speed: number;
};

export function updateMoveSpeed({
  isAccelerating,
  gear: currentGear,
  speedChange: currentSpeedChange,
  speed: currentSpeed,
}: {
  isAccelerating;
} & MoveSpeedState): MoveSpeedState {
  let gear = currentGear;
  let speedChange = currentSpeedChange;
  let speed = currentSpeed;

  const gearDesc = MOVE_GEARS[gear];

  if (isAccelerating) {
    if (speedChange < 0) {
      speedChange = 0;
    }
    speedChange = (speedChange + MOVE_ACCELERATION) / gearDesc.delim;
    speed += speedChange;
  } else {
    if (speed > 0) {
      speedChange = (speedChange - MOVE_DECELERATION) / gearDesc.delim;
      speed = Math.max(0, speed + speedChange);
    }
  }

  if (speed > gearDesc.endAt) {
    gear = Math.min(gear + 1, 5);
  } else if (speed < gearDesc.startAt) {
    gear = Math.max(gear - 1, 1);
  }

  speed = Math.min(speed, gearDesc.endAt);

  return {
    gear,
    speedChange,
    speed,
  };
}
