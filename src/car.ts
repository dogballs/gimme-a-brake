import {
  IW,
  IH,
  RENDER_SCALE,
  MOVE_GEARS,
  MOVE_GEAR_MIN,
  MOVE_GEAR_MAX,
  MOVE_ACCELERATION,
  MOVE_DECELERATION,
} from './config';
import { ImageMap } from './images';
import { SectionKind } from './section';
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
  isThrottleActive,
  sectionKind,
  gear: currentGear,
  speedChange: currentSpeedChange,
  speed: currentSpeed,
}: {
  isThrottleActive: boolean;
  sectionKind: SectionKind;
} & MoveSpeedState): MoveSpeedState {
  let gear = currentGear;
  let speedChange = currentSpeedChange;
  let speed = currentSpeed;

  const gearDesc = MOVE_GEARS[gear];

  if (isThrottleActive) {
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
    gear = Math.min(gear + 1, MOVE_GEAR_MAX);
  } else if (speed < gearDesc.startAt) {
    gear = Math.max(gear - 1, MOVE_GEAR_MIN);
  }

  speed = Math.min(speed, gearDesc.endAt);

  return {
    gear,
    speedChange,
    speed,
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

  update({ isMuted, speed, gear }: { isMuted: boolean } & MoveSpeedState) {
    this.osc.detune.value = 0 + speed;
    this.osc.frequency.value = 30 + speed * 1 * (gear * 3);
  }
}
