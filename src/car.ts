import {
  IW,
  IH,
  HW,
  HH,
  RS,
  MOVE_ACCELERATION,
  MOVE_DECELERATION_FREE,
  MOVE_DECELERATION_REVERSE,
  MOVE_SPEED_MAX,
  MOVE_SPEED_MAX_UPGRADE,
  STEER_LIMIT,
  STEER_SPEED,
  STEER_SPEED_IMPROVED,
  STEER_TURN_COUNTER_FORCE,
  POLE_START,
  POLE_DRIVE,
  POLE_FULL_STOP,
  FONT_PRIMARY,
  SOUND_CURB_ID,
  SOUND_DEATH_ID,
  SOUND_HIT_ID,
  SOUND_LIFE_LOST_ID,
  SOUND_BRAKE_ID,
  SOUND_BUMPER_ID,
} from './config';
import { CollisionBox } from './collision';
import { curveXByY, steerCurve } from './curve';
import { ImageMap } from './images';
import { MenuState } from './menu';
import { Path } from './path';
import { Pole } from './pole';
import { Section } from './section';
import { Stripe, stripesToY } from './stripes';
import { SoundController } from './sound';
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
  const carSteerOffset = -1 * steerOffset * 0.02 * RS;

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
    if (state.invincibleTimePassed > 0) {
      const shouldAlpha =
        Math.round(state.invincibleTimePassed / 0.1) % 2 === 0;
      if (shouldAlpha) {
        ctx.globalAlpha = 0.3;
      }
    }

    ctx.drawImage(image, x, y, carWidth, carHeight);

    if (state.curbTimePassed > 0) {
      const curbDurationUpgrade = upgrades.find(
        (u) => u.kind === 'curb-duration',
      );
      let allowedTime = CURB_ALLOWED_TIME;
      if (curbDurationUpgrade && curbDurationUpgrade.usagePassed != null) {
        allowedTime = CURB_ALLOWED_TIME_UPGRADE;
      }

      const displayTime = (allowedTime - state.curbTimePassed).toFixed(1);

      ctx.strokeStyle = '#d78a35';
      ctx.lineWidth = 1;
      ctx.font = `10px ${FONT_PRIMARY}`;
      ctx.strokeText(displayTime, x + carWidth / 2 - 6, y + carHeight / 2 + 15);
    }

    const parachuteUpgrade = upgrades.find((u) => u.kind === 'parachute');

    if (parachuteUpgrade && parachuteUpgrade.usagePassed != null) {
      const parachuteImage = images.upgradeParachute;
      let parachuteY = y;
      if (Math.round(parachuteUpgrade.usagePassed / 0.05) % 2 === 0) {
        parachuteY -= 2 * RS;
      }

      ctx.drawImage(
        parachuteImage,
        x,
        parachuteY,
        parachuteImage.width,
        parachuteImage.height,
      );
    }

    const nitroUpgrade = upgrades.find((u) => u.kind === 'anti-nitro');
    if (nitroUpgrade && nitroUpgrade.usagePassed != null) {
      const nitroImage = images.upgradeNitro;
      let nitroY = y;
      if (Math.round(nitroUpgrade.usagePassed / 0.01) % 2 === 0) {
        nitroY -= 1 * RS;
      }

      ctx.drawImage(nitroImage, x, nitroY, nitroImage.width, nitroImage.height);
    }

    ctx.globalAlpha = 1;
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

  const width = image.width * scale - 20 * RS;
  const height = image.height * scale;

  const centerX = (IW - width) / 2;
  const carSteerOffset = -1 * steerOffset * 0.02 * RS;

  const depth = 32 * RS;
  const x = centerX + carSteerOffset;
  const y = IH - 78 * RS;
  const z = 16 * RS;

  return {
    x,
    y,
    z,
    width,
    height,
    depth,
  };
}

const CURB_ALLOWED_OVERFLOW = 20 * RS;
const CURB_ALLOWED_TIME = 2;
const CURB_ALLOWED_TIME_UPGRADE = 4;
const INVINCIBLE_DURATION = 2;

export type CarState = {
  curbTimePassed: number;
  curbFrameIndex: number;
  flipTimePassed: number;
  invincibleTimePassed: number;
  isDead: boolean;
};

export const defaultCarState: CarState = {
  curbTimePassed: 0,
  curbFrameIndex: 0,
  flipTimePassed: 0,
  invincibleTimePassed: 0,
  isDead: false,
};

export function updateCarState({
  soundController,
  path,
  state,
  stripes,
  upgrades,
  carBox,
  collidedBoxes,
  deltaTime,
  steerOffset,
}: {
  soundController: SoundController;
  path: Path;
  state: CarState;
  stripes: Stripe[];
  upgrades: Upgrade[];
  carBox: CollisionBox;
  collidedBoxes: CollisionBox[];
  deltaTime: number;
  steerOffset: number;
}): CarState {
  let curbTimePassed = state.curbTimePassed;
  let curbFrameIndex = state.curbFrameIndex;
  let flipTimePassed = state.flipTimePassed;
  let invincibleTimePassed = state.invincibleTimePassed;

  if (invincibleTimePassed > 0) {
    invincibleTimePassed += deltaTime;
    if (invincibleTimePassed > INVINCIBLE_DURATION) {
      invincibleTimePassed = 0;
    }
  }

  if (flipTimePassed > 0) {
    flipTimePassed += deltaTime;
    curbFrameIndex = curbFrameIndex + 1;
    return {
      ...state,
      curbFrameIndex,
      flipTimePassed,
    };
  }

  const hasHitSomething = collidedBoxes.length > 0;
  const isInvincible = invincibleTimePassed > 0;
  if (hasHitSomething && !isInvincible) {
    // Prioritize bumper over lives is bumper is available
    const bumperUpgrade = upgrades.find((u) => u.kind === 'bumper');
    if (bumperUpgrade && bumperUpgrade.cooldownPassed == null) {
      invincibleTimePassed += deltaTime;
      bumperUpgrade.cooldownPassed = 0;
      bumperUpgrade.usagePassed = 0;
      soundController.play(SOUND_BRAKE_ID);
      soundController.play(SOUND_BUMPER_ID);
      return {
        ...state,
        invincibleTimePassed,
      };
    }

    const livesUpgrade = upgrades.find((u) => u.kind === 'lives');
    if (livesUpgrade?.count > 0) {
      livesUpgrade.count -= 1;
      soundController.play(SOUND_LIFE_LOST_ID);

      invincibleTimePassed += deltaTime;

      return {
        ...state,
        invincibleTimePassed,
      };
    }

    flipTimePassed += deltaTime;
    soundController.stopAll();
    soundController.play(SOUND_HIT_ID);
    soundController.play(SOUND_DEATH_ID);
    return {
      ...state,
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

  const curbDurationUpgrade = upgrades.find((u) => u.kind === 'curb-duration');

  if (isTouchingLeftCurb || isTouchingRightCurb) {
    curbTimePassed += deltaTime;
    curbFrameIndex = curbFrameIndex + 1;

    let allowedTime = CURB_ALLOWED_TIME;
    if (curbDurationUpgrade && curbDurationUpgrade.usagePassed == null) {
      curbDurationUpgrade.cooldownPassed = 0;
      curbDurationUpgrade.usagePassed = 0;
    }
    if (curbDurationUpgrade && curbDurationUpgrade.usagePassed != null) {
      allowedTime = CURB_ALLOWED_TIME_UPGRADE;
    }

    if (curbTimePassed > allowedTime) {
      flipTimePassed += deltaTime;
      soundController.stopAll();
      soundController.play(SOUND_DEATH_ID);
    } else {
      soundController.playLoopIfNotPlaying(SOUND_CURB_ID);
    }
  } else {
    curbTimePassed = 0;
    curbFrameIndex = 0;
    soundController.stop(SOUND_CURB_ID);
  }

  return {
    ...state,
    curbTimePassed,
    curbFrameIndex,
    flipTimePassed,
    invincibleTimePassed,
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
