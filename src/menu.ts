import { IW, IH, HW, HH, RS } from './config';
import { KeyboardListener, InputControl } from './controls';
import { ImageMap } from './images';
import { SoundController } from './sound';

const menuSoundId = document.querySelector<HTMLInputElement>(
  '[data-control="menu-sound"]',
);
menuSoundId.onkeydown = (e) => e.stopPropagation();

export type MenuState = {
  isOpen: boolean;
  isAnyKey: boolean;

  selectedIndex: number;
};

export const defaultMenuState: MenuState = {
  isOpen: true,
  isAnyKey: true,
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
    lastTime,
    state,
    images,
  }: {
    lastTime: number;
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

  if (state.isAnyKey) {
    const shouldShow = Math.round(lastTime / 0.5) % 2 === 1;
    if (!shouldShow) {
      return;
    }

    const textX = (IW - 180 * RS) / 2;
    const textY = 110 * RS;

    ctx.lineWidth = 1;
    ctx.font = `${20 * RS}px retro_gaming`;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.fillText('PRESS ANY KEY', textX, textY);
    ctx.lineWidth = 2;
    ctx.strokeText('PRESS ANY KEY', textX, textY);
    return;
  }

  const textX = (IW - 270 * RS) / 2;
  const textY = 60 * RS;

  ctx.lineWidth = 1;
  ctx.font = `${30 * RS}px retro_gaming`;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.fillText('GIMME A BRAKE', textX, textY);
  ctx.lineWidth = 2;
  ctx.strokeText('GIMME A BRAKE', textX, textY);

  ITEMS.forEach((item, index) => {
    drawItem(ctx, {
      lastTime,
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
    lastTime,
    images,
    text,
    index,
    isSelected,
  }: {
    lastTime: number;
    images: ImageMap;
    text: string;
    index: number;
    isSelected: boolean;
  },
) {
  const textX = (IW - 90 * RS) / 2;
  const textY = 100 * RS + 22 * RS * index;

  ctx.font = `${17 * RS}px retro_gaming`;
  ctx.fillStyle = isSelected ? '#e42424' : '#fff';
  ctx.fillText(text, textX, textY);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;

  if (isSelected) {
    const shouldShow = Math.round(lastTime / 0.5) % 2 === 1;
    if (!shouldShow) {
      return;
    }

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
  deltaTime,
  keyboardListener,
  soundController,
}: {
  state: MenuState;
  deltaTime: number;
  keyboardListener: KeyboardListener;
  soundController: SoundController;
}) {
  if (!state.isOpen) {
    return state;
  }

  if (state.isAnyKey) {
    const isDownAny = keyboardListener.isDownAny();
    const isAnyKey = !isDownAny;

    return {
      ...state,
      isAnyKey,
    };
  }

  if (!state.isAnyKey) {
    const soundId = menuSoundId.value.trim();
    soundController.playLoopIfNotPlaying(soundId);
  }

  let selectedIndex = state.selectedIndex;

  const isUp = keyboardListener.isDown(InputControl.Up);
  const isDown = keyboardListener.isDown(InputControl.Down);
  const isSelect = keyboardListener.isDown(InputControl.Select);

  if (isSelect) {
    if (selectedIndex === 0) {
      soundController.stopAll();
      soundController.playLoopIfNotPlaying('theme1');
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
