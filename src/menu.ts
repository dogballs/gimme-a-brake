import { IW, IH, HW, HH, RS } from './config';
import { KeyboardListener, InputControl } from './controls';
import { ImageMap } from './images';

export type MenuState = {
  isOpen: boolean;
  selectedIndex: number;
};

export const defaultMenuState: MenuState = {
  isOpen: true,
  selectedIndex: 0,
};

const ITEMS = [
  {
    label: 'PLAY',
  },
  { label: 'SOUND: ON' },
  { label: 'CREDITS' },
];

export function drawMenu(
  ctx,
  {
    state,
    images,
  }: {
    state: MenuState;
    images: ImageMap;
  },
) {
  if (!state.isOpen) {
    return;
  }

  const overlayWidth = 200 * RS;
  const overlayHeight = 150 * RS;

  ctx.fillStyle = '#000';
  ctx.globalAlpha = 0.7;
  ctx.fillRect(0, 0, IW, IH);
  ctx.globalAlpha = 1;

  const textX = (IW - 270 * RS) / 2;
  const textY = 40 * RS;

  ctx.lineWidth = 1;
  ctx.font = `${30 * RS}px retro_gaming`;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.fillText('GIMME A BRAKE', textX, textY);
  ctx.lineWidth = 2;
  ctx.strokeText('GIMME A BRAKE', textX, textY);

  ITEMS.forEach((item, index) => {
    drawItem(ctx, {
      images,
      text: item.label,
      index,
      isSelected: index === state.selectedIndex,
    });
  });
}

function drawItem(
  ctx,
  {
    images,
    text,
    index,
    isSelected,
  }: { images: ImageMap; text: string; index: number; isSelected: boolean },
) {
  const textX = (IW - 90 * RS) / 2;
  const textY = 80 * RS + 22 * RS * index;

  ctx.font = `${17 * RS}px retro_gaming`;
  ctx.fillStyle = isSelected ? '#e42424' : '#fff';
  ctx.fillText(text, textX, textY);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;

  if (isSelected) {
    const image = images.menuBullet;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      image,
      textX - 16 * RS,
      textY - 12 * RS,
      image.width * 2 * RS,
      image.height * 2 * RS,
    );
    ctx.imageSmoothingEnabled = true;
  }
}

export function updateMenuState({
  state,
  keyboardListener,
}: {
  state: MenuState;
  keyboardListener: KeyboardListener;
}) {
  let selectedIndex = state.selectedIndex;

  const isUp = keyboardListener.isDown(InputControl.Up);
  const isDown = keyboardListener.isDown(InputControl.Down);
  const isSelect = keyboardListener.isDown(InputControl.Select);

  if (isSelect) {
    if (selectedIndex === 0) {
      return { ...state, isOpen: false };
    }
    return {
      ...state,
    };
  }

  if (isUp) {
    selectedIndex = Math.max(0, selectedIndex - 1);
  } else if (isDown) {
    selectedIndex = Math.min(ITEMS.length - 1, selectedIndex + 1);
  }

  return {
    ...state,
    selectedIndex,
  };
}
