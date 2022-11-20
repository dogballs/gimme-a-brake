import { IW, IH } from './config';
import { KeyboardListener, InputControl } from './controls';
import { Zone } from './zone';

export type Upgrade = {
  kind: 'improved_steering' | 'lower_max_speed' | 'bumper' | 'lives';
  active: boolean;
  description: string;
  cooldown?: number;
  count?: number;
};

export const ALL_UPGRADES: Upgrade[] = [
  {
    kind: 'improved_steering',
    description: 'Improves handling',
    active: false,
  },
  {
    kind: 'lower_max_speed',
    description: 'Reduces max speed',
    active: false,
  },
  {
    kind: 'bumper',
    description: 'Allows bumping into obstacles. Cooldown: 10 sec',
    active: false,
    cooldown: 10,
  },
  {
    kind: 'lives',
    description: 'Protects from an obstacle hit. Lives: 3',
    active: false,
    count: 3,
  },
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
    // TODO: pick random ones
    const dialogUpgrades = [ALL_UPGRADES[0], ALL_UPGRADES[1], ALL_UPGRADES[2]];
    return {
      ...state,
      isDialogOpen: true,
      dialogSelectedIndex: 0,
      dialogUpgrades,
    };
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

export function drawUpgradeDialog(ctx, state: UpgradeState) {
  if (!state.isDialogOpen) {
    return;
  }

  const width = 200;
  const height = 100;

  const x = (IW - width) / 2;
  const y = (IH - height) / 2;

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, IW, IH);

  ctx.globalAlpha = 1;
  ctx.fillStyle = 'grey';
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 5;
  ctx.strokeRect(x, y, width, height);

  state.dialogUpgrades.forEach((upgrade, index) => {
    drawUpgradeItem(ctx, {
      upgrade,
      index,
      isSelected: state.dialogSelectedIndex === index,
    });
  });
}

// TODO: add icons
function drawUpgradeItem(
  ctx,
  {
    upgrade,
    isSelected,
    index,
  }: { upgrade: Upgrade; isSelected: boolean; index: number },
) {
  const width = 30;
  const height = 30;

  const x = 130 + 45 * index;
  const y = 65;

  ctx.strokeStyle = isSelected ? '#a22' : '#fff';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);

  if (isSelected) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    ctx.font = '10px serif';
    ctx.strokeText(upgrade.description, 100, 120, 180);
  }
}
