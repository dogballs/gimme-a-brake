import { IW, IH, RS } from './config';
import { KeyboardListener, InputControl } from './controls';
import { ImageMap } from './images';
import { randomElements } from './random';
import { Zone } from './zone';

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
  cooldown?: number;
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
    description: 'Slows by bumping into obstacles. Cooldown: 10 sec',
    active: false,
    cooldown: 10,
    // breaks and blocks a slot?
  },
  {
    kind: 'lives',
    description: 'Protects from an obstacle hit. Lives: 3',
    active: false,
    count: 3,
    // slow down?
    // expires? blocks a slot?
  },
  {
    kind: 'parachute',
    description: 'Decelerates to 0',
    active: true,
    // count?
    // cd?
  },
  {
    kind: 'anti-nitro',
    description: 'Backwards nitro',
    active: true,
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
    description: 'Use curb to slow down. Heats up.',
    active: false,
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
  state,
  zone,
}: {
  keyboardListener: KeyboardListener;
  state: UpgradeState;
  zone: Zone;
}): UpgradeState {
  if (!state.isDialogOpen && zone.offerUpgrade && !zone.gotUpgrade) {
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
    return state;
  }

  const isSelected = keyboardListener.isDown(InputControl.Select);
  if (isSelected) {
    const newUpgrade = state.dialogUpgrades[state.dialogSelectedIndex];
    const upgrades = [...state.upgrades, newUpgrade];

    zone.gotUpgrade = true;

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
  const height = 100 * RS;

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

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.font = `${9 * RS}px serif`;
  ctx.strokeText('Pick an upgrade:', x + 10 * RS, y + 15 * RS);

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
  const y = 80 * RS;
  const size = 32 * RS;

  drawUpgradeImage(ctx, { upgrade, images, x, y, size });

  ctx.strokeStyle = isSelected ? '#d73131' : '#fff';
  ctx.lineWidth = 2 * RS;
  ctx.strokeRect(x, y, size, size);

  if (isSelected) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    ctx.font = `${10 * RS}px serif`;
    ctx.strokeText(upgrade.description, 100 * RS, 128 * RS, 180 * RS);
    ctx.strokeText(
      upgrade.active ? 'Active' : 'Passive',
      100 * RS,
      140 * RS,
      180 * RS,
    );
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
  const x = 350 * RS - 28 * RS * index;
  const y = 5 * RS;
  const size = 24 * RS;

  drawUpgradeImage(ctx, { upgrade, images, x, y, size });
}
