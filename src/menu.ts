import { IW, IH, HW, HH, RS, FONT_PRIMARY } from './config';
import { KeyboardListener, InputControl } from './controls';
import { ImageMap } from './images';
import { SoundController } from './sound';

export type MenuState = {
  isOpen: boolean;
  isAnyKey: boolean;
  isSoundOn: boolean; // TODO: local storage?
  isPlaying: boolean;
  selectedIndex: number;
};

const SKIP_FOR_DEV = false;

export const defaultMenuState: MenuState = {
  isOpen: SKIP_FOR_DEV ? false : true,
  isAnyKey: SKIP_FOR_DEV ? false : true,
  isSoundOn: true,
  isPlaying: false,
  selectedIndex: 0,
};

type MenuItem = {
  id: string;
  label: string;
};

const ITEMS: MenuItem[] = [
  { id: 'play', label: 'PLAY' },
  { id: 'sound', label: 'SOUND: ' },
  { id: 'credits', label: 'CREDITS' },
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

    const textX = (IW - 210 * RS) / 2;
    const textY = 110 * RS;

    ctx.lineWidth = 1;
    ctx.font = `${20 * RS}px ${FONT_PRIMARY}`;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.fillText('PRESS SPACEBAR', textX, textY);
    ctx.lineWidth = 2;
    ctx.strokeText('PRESS SPACEBAR', textX, textY);
    return;
  }

  const textX = (IW - 270 * RS) / 2;
  const textY = 60 * RS;

  ctx.lineWidth = 1;
  ctx.font = `${30 * RS}px ${FONT_PRIMARY}`;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.fillText('GIMME A BRAKE', textX, textY);
  ctx.lineWidth = 2;
  ctx.strokeText('GIMME A BRAKE', textX, textY);

  ITEMS.forEach((item, index) => {
    drawItem(ctx, {
      lastTime,
      images,
      state,
      item,
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
    state,
    item,
    index,
    isSelected,
  }: {
    lastTime: number;
    images: ImageMap;
    state: MenuState;
    item: MenuItem;
    index: number;
    isSelected: boolean;
  },
) {
  const textX = (IW - 90 * RS) / 2;
  const textY = 100 * RS + 22 * RS * index;

  ctx.font = `${17 * RS}px ${FONT_PRIMARY}`;
  ctx.fillStyle = isSelected ? '#e42424' : '#fff';

  let text = item.label;
  if (item.id === 'sound') {
    text += '' + (state.isSoundOn ? 'ON' : 'OFF');
  }
  if (item.id === 'play' && state.isPlaying) {
    text = 'CONTINUE';
  }
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

const SOUND_SELECT_ID = 'menuSelect1';
const SOUND_FOCUS_ID = 'menuFocus1';
const SOUND_THEME_ID = 'theme1';
const SOUND_MENU_ID = 'menu1';

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
  const isBack = keyboardListener.isDown(InputControl.Back);

  if (!state.isOpen) {
    if (isBack) {
      soundController.pauseAll();
      soundController.play(SOUND_SELECT_ID);

      return {
        ...state,
        isOpen: true,
      };
    }
    return state;
  }

  if (state.isAnyKey) {
    const isDown = keyboardListener.isDown(InputControl.Select);
    const isAnyKey = !isDown;

    return {
      ...state,
      isAnyKey,
    };
  }

  if (!state.isAnyKey) {
    soundController.playLoopIfNotPlaying(SOUND_MENU_ID);
  }

  let selectedIndex = state.selectedIndex;

  const isUp = keyboardListener.isDown(InputControl.Up);
  const isDown = keyboardListener.isDown(InputControl.Down);
  const isSelect = keyboardListener.isDown(InputControl.Select);

  const returnToPlaying = () => {
    soundController.stop(SOUND_MENU_ID);
    soundController.play(SOUND_SELECT_ID);
    soundController.resumeAll();
    if (!soundController.canResume(SOUND_THEME_ID)) {
      soundController.playLoopIfNotPlaying(SOUND_THEME_ID);
    }
    return { ...state, isOpen: false, isPlaying: true };
  };

  if (state.isPlaying && isBack) {
    return returnToPlaying();
  }

  if (isSelect) {
    if (selectedIndex === 0) {
      if (state.isPlaying) {
        return returnToPlaying();
      } else {
        soundController.stopAll();
        soundController.play(SOUND_SELECT_ID);
        setTimeout(() => {
          if (!soundController.isPlaying(SOUND_MENU_ID)) {
            soundController.playLoop(SOUND_THEME_ID);
          }
        }, 1500);
      }
      return { ...state, isOpen: false, isPlaying: true };
    }
    if (selectedIndex === 1) {
      const isSoundOn = !state.isSoundOn;
      soundController.setGlobalMuted(!isSoundOn);
      soundController.play(SOUND_SELECT_ID);

      return {
        ...state,
        isSoundOn,
      };
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
  if (isUp || isDown) {
    soundController.play(SOUND_FOCUS_ID);
  }

  return {
    ...state,
    selectedIndex,
  };
}
