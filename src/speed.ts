import {
  IW,
  IH,
  HW,
  HH,
  RS,
  MOVE_ACCELERATION,
  MOVE_DECELERATION_FREE,
  MOVE_DECELERATION_REVERSE,
  MOVE_DECELERATION_DEATH,
  MOVE_DECELERATION_UPHILL_UPGRADE,
  MOVE_DECELERATION_BUMPER_UPGRADE,
  MOVE_DECELERATION_PARACHUTE_UPGRADE,
  MOVE_DECELERATION_NITRO_UPGRADE,
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
} from './config';
import { CarState } from './car';
import { EndingState } from './ending';
import { MenuState } from './menu';
import { Path } from './path';
import { Pole } from './pole';
import { Section } from './section';
import { Stripe, stripesToY } from './stripes';
import { Upgrade } from './upgrade';
import { Context2D } from './types';

export type SpeedState = {
  moveGear: number;
  moveSpeedChange: number;
  moveSpeed: number;
};

export const defaultMoveSpeedState: SpeedState = {
  moveGear: 2,
  moveSpeedChange: 0,
  moveSpeed: 2.6,
};

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

export function updateMoveSpeedState({
  section,
  nextPole,
  carState,
  endingState,
  upgrades,
  moveOffset,
  isThrottleActive,
  isReverseActive,
  moveGear: currentMoveGear,
  moveSpeedChange: currentMoveSpeedChange,
  moveSpeed: currentMoveSpeed,
}: {
  section: Section;
  nextPole: Pole | undefined;
  carState: CarState;
  endingState: EndingState;
  upgrades: Upgrade[];
  moveOffset: number;
  isThrottleActive: boolean;
  isReverseActive: boolean;
} & SpeedState): SpeedState {
  // Story mode - forced acceleration, no brakes
  // const isThrottle = isThrottleActive;
  // const isReverse = isReverseActive;
  const isThrottle = true;
  const isReverse = false;

  let gear = currentMoveGear;
  let speedChange = currentMoveSpeedChange;
  let speed = currentMoveSpeed;

  const gearDesc = getMoveGears({ upgrades })[gear];

  if (carState.flipTimePassed > 0) {
    speedChange = (speedChange - MOVE_DECELERATION_DEATH) / gearDesc.delim;
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

  if (isThrottle) {
    if (speedChange < 0) {
      speedChange = 0;
    }
    const parachuteUpgrade = upgrades.find((u) => u.kind === 'parachute');
    const bumperUpgrade = upgrades.find((u) => u.kind === 'bumper');
    const nitroUpgrade = upgrades.find((u) => u.kind === 'anti-nitro');
    const uphillSlowUpgrade = upgrades.find(
      (u) => u.kind === 'turn-uphill-slow',
    );
    const hasUphillOrTurnSection = [
      'turn-left',
      'turn-right',
      'uphill',
    ].includes(section.kind);
    if (bumperUpgrade && bumperUpgrade.usagePassed != null) {
      speedChange =
        (speedChange - MOVE_DECELERATION_BUMPER_UPGRADE) / gearDesc.delim;
      speed = Math.max(2, speed + speedChange);
    } else if (parachuteUpgrade && parachuteUpgrade.usagePassed != null) {
      speedChange =
        (speedChange - MOVE_DECELERATION_PARACHUTE_UPGRADE) / gearDesc.delim;
      speed = Math.max(0, speed + speedChange);
    } else if (nitroUpgrade && nitroUpgrade.usagePassed != null) {
      speedChange =
        (speedChange - MOVE_DECELERATION_NITRO_UPGRADE) / gearDesc.delim;
      speed = Math.max(0, speed + speedChange);
    } else if (uphillSlowUpgrade && hasUphillOrTurnSection) {
      // Slows down and drops to certain speed with an upgrade
      speedChange =
        (speedChange - MOVE_DECELERATION_UPHILL_UPGRADE) / gearDesc.delim;
      speed = Math.max(3, speed + speedChange);
    } else {
      // Default acceleration
      speedChange = (speedChange + MOVE_ACCELERATION) / gearDesc.delim;
      speed = Math.max(0, speed + speedChange);
    }
  } else {
    if (speed > 0) {
      if (isReverse) {
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

export function drawSpeedometer(
  ctx,
  {
    state: { moveSpeed, moveGear },
    upgrades,
  }: { state: SpeedState; upgrades: Upgrade[] },
) {
  const overlayWidth = 100 * RS;
  const overlayHeight = 20 * RS;

  const displaySpeed = Math.floor(moveSpeed * 20)
    .toString()
    .padStart(3);

  const textX = IW - 75 * RS;
  const textY = 25 * RS;

  ctx.lineWidth = 1;
  ctx.font = `${20 * RS}px ${FONT_PRIMARY}`;
  ctx.fillStyle = '#444';
  ctx.strokeStyle = '#000';
  ctx.fillText(displaySpeed, textX, textY, 55);
  ctx.lineWidth = 1;
  ctx.strokeText(displaySpeed, textX, textY, 55);

  ctx.lineWidth = 1;
  ctx.font = `${10 * RS}px ${FONT_PRIMARY}`;
  ctx.fillStyle = '#333';
  ctx.fillText('mph', textX + 40 * RS, textY - 4 * RS);

  const gear = getMoveGears({ upgrades })[moveGear];
  const gearT = (moveSpeed - gear.startAt) / (gear.endAt - gear.startAt);

  const barsCount = 16;
  const barWidth = 5;

  const barsFilled = Math.round(barsCount * gearT);

  for (let i = 0; i < barsCount; i++) {
    const baseX = IW - 74 * RS;
    const x = baseX + i * 4 * RS;
    const y = 32 * RS;
    const width = 2 * RS;
    const height = 6 * RS;

    ctx.fillStyle = '#444';
    ctx.strokeStyle = '#333';
    if (i < barsFilled) {
      ctx.fillRect(x, y, width, height);
    }
    ctx.strokeRect(x, y, width, height);
  }
}

export class SpeedAudio {
  private osc: OscillatorNode;
  private gain: GainNode;
  private isMuted: boolean = true;

  constructor(private readonly getContext: () => AudioContext) {}

  ensureOsc() {
    if (this.osc) {
      return;
    }

    this.osc = this.getContext().createOscillator();
    this.osc.type = 'triangle';

    this.gain = this.getContext().createGain();
    this.gain.gain.value = 0.3;

    this.osc.start();
    this.osc.connect(this.gain).connect(this.getContext().destination);
  }

  update({
    menuState,
    upgrades,
    moveSpeed,
    moveSpeedChange,
    moveGear,
  }: { menuState: MenuState; upgrades: Upgrade[] } & SpeedState) {
    this.ensureOsc();

    this.gain.gain.value = menuState.isSoundOn ? 0.3 : 0;

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
