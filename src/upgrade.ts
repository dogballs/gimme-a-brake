import { IW, IH, RS, FONT_PRIMARY } from './config';
import { KeyboardListener, InputControl } from './controls';
import { ImageMap } from './images';
import { randomElements } from './random';
import { SoundController } from './sound';
import { Pole } from './pole';

type UpgradeKind =
  | 'improved-steering'
  | 'lower-max-speed'
  | 'bumper'
  | 'lives'
  | 'parachute'
  | 'anti-nitro'
  | 'rocket-launcher'
  | 'curb-stop'
  | 'turn-uphill-slow';

export type Upgrade = {
  kind: UpgradeKind;
  active: boolean;
  description: string;
  description2?: string;
  cooldown?: number;
  cooldownPassed?: number;
  count?: number;
};

export const ALL_UPGRADES: Upgrade[] = [
  {
    kind: 'improved-steering',
    description: 'Improved handling',
    active: false,
  },
  {
    kind: 'lower-max-speed',
    description: 'Reduces max speed',
    active: false,
  },
  {
    kind: 'bumper',
    description: 'Slows by bumping into obstacles',
    description2: 'Cooldown: 10 sec',
    active: false,
    cooldown: 10,
    // breaks and blocks a slot?
  },
  {
    kind: 'lives',
    description: 'Protects from an obstacle hit ',
    description2: 'Lives: 3',
    active: false,
    count: 3,
    // slow down?
    // expires? blocks a slot?
  },
  {
    kind: 'parachute',
    description: 'Decelerates to 0',
    active: true,
    cooldown: 10,
    // count?
    // cd?
  },
  {
    kind: 'anti-nitro',
    description: 'Backwards nitro',
    active: true,
    cooldown: 10,
    // cd?
  },
  // {
  //   kind: 'rocket-launcher',
  //   description: 'Shoot rockets to kill obstacles. Cooldown: 10 sec',
  //   active: true,
  //   // cd?
  //   // count
  // },
  {
    kind: 'curb-stop',
    description: 'Use curb to slow down',
    description2: 'Cooldown: 10',
    active: false,
    cooldown: 20,
    // heat? cd?
  },
  {
    kind: 'turn-uphill-slow',
    description: 'Slows down on turns and uphills',
    active: false,
  },
  // timestop?
  // reduce amount of obstacles
  //
];

export type UpgradeState = {
  isDialogOpen: boolean;
  dialogSelectedIndex: number;
  dialogUpgrades: Upgrade[];
  upgrades: Upgrade[];
};

export const defaultUpgradeState: UpgradeState = {
  isDialogOpen: false,
  dialogSelectedIndex: 0,
  dialogUpgrades: [],
  upgrades: [],
};

export function updateUpgradeState({
  keyboardListener,
  soundController,
  deltaTime,
  state,
  nextPole,
  moveOffset,
}: {
  keyboardListener: KeyboardListener;
  soundController: SoundController;
  deltaTime: number;
  state: UpgradeState;
  nextPole: Pole | undefined;
  moveOffset: number;
}): UpgradeState {
  const shouldOpenUpgrade =
    nextPole && nextPole.arrived && !nextPole.granted && !state.isDialogOpen;

  if (shouldOpenUpgrade) {
    const hasActive = state.upgrades.some((u) => u.active);
    const availableUpgrades = ALL_UPGRADES.filter((allUpgrade) => {
      const hasIt = state.upgrades.some((u) => u.kind === allUpgrade.kind);
      if (hasIt) {
        return false;
      }
      if (allUpgrade.active && hasActive) {
        return false;
      }
      return true;
    });

    const dialogUpgrades = randomElements(availableUpgrades, 3);

    return {
      ...state,
      isDialogOpen: true,
      dialogSelectedIndex: 0,
      dialogUpgrades,
    };
  }

  if (!state.isDialogOpen) {
    const isActivated = keyboardListener.isDown(InputControl.Select);
    if (isActivated) {
      const activeIndex = state.upgrades.findIndex((upgrade) => {
        return upgrade.active === true;
      });

      if (activeIndex !== -1) {
        const activeUpgrade = state.upgrades[activeIndex];
        if (activeUpgrade.cooldownPassed == null) {
          activeUpgrade.cooldownPassed = 0;
        }
      }
    }

    // Mutates upgrades - updates cooldowns
    state.upgrades.forEach((upgrade) => {
      if (upgrade.cooldown != null && upgrade.cooldownPassed != null) {
        upgrade.cooldownPassed += deltaTime;
        if (upgrade.cooldownPassed > upgrade.cooldown) {
          upgrade.cooldownPassed = null;
        }
      }
    });
    return state;
  }

  const isSelected = keyboardListener.isDown(InputControl.Select);
  if (isSelected) {
    const newUpgrade = state.dialogUpgrades[state.dialogSelectedIndex];
    const upgrades = [...state.upgrades, newUpgrade];

    nextPole.granted = true;
    soundController.play('upgradePicked1');

    return {
      ...state,
      upgrades,
      isDialogOpen: false,
      dialogUpgrades: [],
      dialogSelectedIndex: 0,
    };
  }

  const isLeft = keyboardListener.isDown(InputControl.Left);
  const isRight = keyboardListener.isDown(InputControl.Right);

  let dialogSelectedIndex = state.dialogSelectedIndex;
  if (isLeft) {
    dialogSelectedIndex -= 1;
    if (dialogSelectedIndex < 0) {
      dialogSelectedIndex = state.dialogUpgrades.length - 1;
    }
  } else if (isRight) {
    dialogSelectedIndex += 1;
    if (dialogSelectedIndex > state.dialogUpgrades.length - 1) {
      dialogSelectedIndex = 0;
    }
  }
  if (isLeft || isRight) {
    soundController.play('menuFocus2');
  }

  return {
    ...state,
    dialogSelectedIndex,
  };
}

const SPRITE_MAP = new Map<
  UpgradeKind,
  {
    x: number;
    y: number;
  }
>();
SPRITE_MAP.set('improved-steering', { x: 0, y: 0 });
SPRITE_MAP.set('lives', { x: 32, y: 0 });
SPRITE_MAP.set('bumper', { x: 64, y: 0 });
SPRITE_MAP.set('curb-stop', { x: 96, y: 0 });
SPRITE_MAP.set('turn-uphill-slow', { x: 128, y: 0 });
SPRITE_MAP.set('anti-nitro', { x: 160, y: 0 });
SPRITE_MAP.set('parachute', { x: 192, y: 0 });
SPRITE_MAP.set('lower-max-speed', { x: 224, y: 0 });

export function drawUpgradeDialog(
  ctx,
  { images, state }: { images: ImageMap; state: UpgradeState },
) {
  if (!state.isDialogOpen) {
    return;
  }

  const width = 200 * RS;
  const height = 130 * RS;

  const x = (IW - width) / 2;
  const y = (IH - height) / 2;

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, IW, IH);

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#409398';
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = '#2b7d82';
  ctx.lineWidth = 5 * RS;
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = '#222';
  ctx.font = `${12 * RS}px ${FONT_PRIMARY}`;
  ctx.fillText('Pick an upgrade:', x + 10 * RS, y + 20 * RS);

  state.dialogUpgrades.forEach((upgrade, index) => {
    drawUpgradeDialogItem(ctx, {
      images,
      upgrade,
      index,
      isSelected: state.dialogSelectedIndex === index,
    });
  });
}

// TODO: add icons
function drawUpgradeDialogItem(
  ctx,
  {
    images,
    upgrade,
    isSelected,
    index,
  }: {
    images: ImageMap;
    upgrade: Upgrade;
    isSelected: boolean;
    index: number;
  },
) {
  const x = 130 * RS + 45 * RS * index;
  const y = 70 * RS;
  const size = 32 * RS;

  drawUpgradeImage(ctx, { upgrade, images, x, y, size });

  if (isSelected) {
    ctx.strokeStyle = '#e42424';
    ctx.lineWidth = 2 * RS;
    ctx.strokeRect(x, y, size, size);

    const startY = 124;
    const gapY = 12;

    ctx.fillSttyle = '#222';
    ctx.font = `${8 * RS}px ${FONT_PRIMARY}`;
    ctx.fillText(
      upgrade.active ? 'Active' : 'Passive',
      100 * RS,
      startY * RS,
      180 * RS,
    );
    ctx.fillText(upgrade.description, 100 * RS, (startY + gapY) * RS, 180 * RS);
    if (upgrade.description2) {
      ctx.fillText(
        upgrade.description2,
        100 * RS,
        (startY + gapY * 2) * RS,
        140 * RS,
      );
    }
  }
}

function drawUpgradeImage(
  ctx,
  {
    upgrade,
    images,
    x,
    y,
    size = 32,
  }: {
    upgrade: Upgrade;
    images: ImageMap;
    x: number;
    y: number;
    size?: number;
  },
) {
  const image = images.upgrades;

  const { x: sourceX, y: sourceY } = SPRITE_MAP.get(upgrade.kind);

  const sourceWidth = 32;
  const sourceHeight = 32;

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    size,
    size,
  );

  if (upgrade.active) {
    ctx.drawImage(image, 0, 32, sourceWidth, sourceHeight, x, y, size, size);
  }

  if (upgrade.kind === 'lives') {
    ctx.fillStyle = '#fff';
    if (size === 24 * RS) {
      ctx.font = `${10 * RS}px ${FONT_PRIMARY}`;
      ctx.fillText(upgrade.count, x + 8 * RS, y + 16 * RS);
    } else {
      ctx.font = `${12 * RS}px ${FONT_PRIMARY}`;
      ctx.fillText(upgrade.count, x + 11 * RS, y + 21 * RS);
    }
  }

  if (upgrade.cooldown != null && upgrade.cooldownPassed != null) {
    const niceTime = Math.floor(upgrade.cooldown - upgrade.cooldownPassed);

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'grey';
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    ctx.globalAlpha = 1;

    ctx.lineWidth = 1;
    ctx.font = `${12 * RS}px ${FONT_PRIMARY}`;
    ctx.strokeStyle = '#fff';
    ctx.fillText(niceTime, x + 10 * RS, y + 16 * RS);
  }
}

export function drawActiveUpgrades(
  ctx,
  {
    state,
    images,
  }: {
    state: UpgradeState;
    images: ImageMap;
  },
) {
  state.upgrades.forEach((upgrade, index) => {
    drawActiveUpgradeItem(ctx, { upgrade, images, index });
  });
}

function drawActiveUpgradeItem(
  ctx,
  {
    upgrade,
    images,
    index,
  }: {
    upgrade: Upgrade;
    images: ImageMap;
    index: number;
  },
) {
  const x = 5 * RS - 28 * RS * index;
  const y = 5 * RS;
  const size = 24 * RS;

  drawUpgradeImage(ctx, { upgrade, images, x, y, size });
}
