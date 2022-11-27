import {
  IW,
  IH,
  HW,
  HH,
  RS,
  FONT_PRIMARY,
  SOUND_MENU_SELECT_ID,
  SOUND_MENU_FOCUS_ID,
  SOUND_MENU_THEME_ID,
  SOUND_GAME_THEME_ID,
} from './config';
import { CarState } from './car';
import { KeyboardListener, InputControl } from './controls';
import { SpeedState } from './speed';
import { ImageMap } from './images';
import { SoundController } from './sound';
import { ResetGlobalState } from './state';

export type MenuState = {
  isOpen: boolean;
  isAnyKey: boolean;
  isSoundOn: boolean; // TODO: local storage?
  isPlaying: boolean;
  isGameOver: boolean;
  deathTimePassed: number;
  selectedIndex: number;
};

const SKIP_FOR_DEV = false;

export const defaultMenuState: MenuState = {
  isOpen: SKIP_FOR_DEV ? false : true,
  isAnyKey: SKIP_FOR_DEV ? false : true,
  // isSoundOn: true,
  isSoundOn: false,
  isPlaying: false,
  isGameOver: false,
  deathTimePassed: 0,
  selectedIndex: 0,
};

type MenuItem = {
  id: string;
  label: string;
};

const MAIN_MENU_ITEMS: MenuItem[] = [
  { id: 'play', label: 'PLAY' },
  { id: 'sound', label: 'SOUND: ' },
  { id: 'credits', label: 'CREDITS' },
];

const GAME_OVER_ITEMS: MenuItem[] = [
  { id: 'retry', label: 'TRY AGAIN' },
  { id: 'main', label: 'MAIN MENU' },
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

  if (state.isGameOver) {
    drawGameOverMenu(ctx, {
      lastTime,
      state,
      images,
    });
    return;
  }

  drawOverlay(ctx);

  if (state.isAnyKey) {
    const shouldShow = Math.round(lastTime / 0.5) % 2 === 1;
    if (!shouldShow) {
      return;
    }
    const x = (IW - 260 * RS) / 2;
    const y = 110 * RS;
    drawBigText(ctx, { text: 'PRESS ANY SPACEBAR', size: 20, x, y });
    return;
  }

  const textX = (IW - 270 * RS) / 2;
  const textY = 60 * RS;
  drawBigText(ctx, { text: 'GIMME A BRAKE', size: 30, x: textX, y: textY });

  MAIN_MENU_ITEMS.forEach((item, index) => {
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

function drawBigText(
  ctx,
  {
    text,
    size,
    x,
    y,
    fillStyle = '#fff',
  }: { text: string; size: number; x: number; y: number; fillStyle?: string },
) {
  ctx.lineWidth = 1;
  ctx.font = `${size * RS}px ${FONT_PRIMARY}`;
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = '#000';
  ctx.fillText(text, x, y);
  ctx.lineWidth = 2;
  ctx.strokeText(text, x, y);
}

function drawOverlay(ctx) {
  const overlayWidth = 200 * RS;
  const overlayHeight = 150 * RS;

  ctx.fillStyle = '#444';
  ctx.globalAlpha = 0.7;
  ctx.fillRect(0, 0, IW, IH);
  ctx.globalAlpha = 1;
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

function drawGameOverMenu(
  ctx,
  {
    lastTime,
    state,
    images,
  }: { lastTime: number; state: MenuState; images: ImageMap },
) {
  drawOverlay(ctx);

  const textX = 110 * RS;
  const textY = 50 * RS;
  drawBigText(ctx, {
    text: 'GAME OVER :(',
    size: 25,
    x: textX,
    y: textY,
    fillStyle: '#e42424',
  });

  GAME_OVER_ITEMS.forEach((item, index) => {
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

export function updateMenuState({
  state,
  carState,
  speedState,
  deltaTime,
  keyboardListener,
  soundController,
  resetGlobalState,
}: {
  state: MenuState;
  carState: CarState;
  speedState: SpeedState;
  deltaTime: number;
  keyboardListener: KeyboardListener;
  soundController: SoundController;
  resetGlobalState: ResetGlobalState;
}) {
  if (!state.isOpen) {
    // Observe speed state and car state for triggering death
    if (carState.flipTimePassed > 0 && speedState.moveSpeed === 0) {
      const deathTimePassed = state.deathTimePassed + deltaTime;

      // Trigger game over menu a bit later
      if (deathTimePassed > 1.5) {
        soundController.stopAll();
        soundController.play('lost1');

        return {
          ...state,
          isOpen: true,
          isGameOver: true,
        };
      }
      return {
        ...state,
        deathTimePassed,
      };
    }

    // Pressing ESC when playing
    const isBack = keyboardListener.isDown(InputControl.Back);
    if (isBack) {
      // Ignore ESC when death animation started
      if (carState.flipTimePassed > 0) {
        return state;
      }

      soundController.pauseAll();
      soundController.play(SOUND_MENU_SELECT_ID);

      return {
        ...state,
        isOpen: true,
      };
    }
    return state;
  }

  // Game over screen
  if (state.isGameOver) {
    return updateGameOverState({
      keyboardListener,
      soundController,
      state,
      resetGlobalState,
    });
  }

  // Entry screen
  if (state.isAnyKey) {
    const isDown = keyboardListener.isDown(InputControl.Select);
    const isAnyKey = !isDown;

    return {
      ...state,
      isAnyKey,
    };
  }

  // Main menu

  soundController.playLoopIfNotPlaying(SOUND_MENU_THEME_ID);

  let selectedIndex = state.selectedIndex;

  const isUp = keyboardListener.isDown(InputControl.Up);
  const isDown = keyboardListener.isDown(InputControl.Down);
  const isSelect = keyboardListener.isDown(InputControl.Select);
  const isBack = keyboardListener.isDown(InputControl.Back);

  // Pressing ESC when the menu is open to close it
  if (state.isPlaying && isBack) {
    return returnToPlaying({ state, soundController });
  }

  if (isSelect) {
    // Pressing PLAY
    if (selectedIndex === 0) {
      if (state.isPlaying) {
        return returnToPlaying({ state, soundController });
      }
      return startPlaying({ state, soundController });
    }
    if (selectedIndex === 1) {
      const isSoundOn = !state.isSoundOn;
      soundController.setGlobalMuted(!isSoundOn);
      soundController.play(SOUND_MENU_SELECT_ID);

      return {
        ...state,
        isSoundOn,
      };
    }

    // TODO: credits menu

    return {
      ...state,
    };
  }

  if (isUp) {
    selectedIndex = Math.max(0, selectedIndex - 1);
  } else if (isDown) {
    selectedIndex = Math.min(MAIN_MENU_ITEMS.length - 1, selectedIndex + 1);
  }
  if (isUp || isDown) {
    soundController.play(SOUND_MENU_FOCUS_ID);
  }

  return {
    ...state,
    selectedIndex,
  };
}

function startPlaying({
  state,
  soundController,
}: {
  state: MenuState;
  soundController: SoundController;
}): MenuState {
  soundController.stopAll();
  soundController.play(SOUND_MENU_SELECT_ID);
  // Delay the sound cause it's better like that
  setTimeout(() => {
    if (!soundController.isPlaying(SOUND_MENU_THEME_ID)) {
      soundController.playLoop(SOUND_GAME_THEME_ID);
    }
  }, 1500);
  return { ...state, isOpen: false, isPlaying: true };
}

function returnToPlaying({
  state,
  soundController,
}: {
  state: MenuState;
  soundController: SoundController;
}): MenuState {
  soundController.stop(SOUND_MENU_THEME_ID);
  soundController.play(SOUND_MENU_SELECT_ID);
  soundController.resumeAll();
  if (!soundController.canResume(SOUND_GAME_THEME_ID)) {
    soundController.playLoopIfNotPlaying(SOUND_GAME_THEME_ID);
  }
  return { ...state, isOpen: false, isPlaying: true };
}

function updateGameOverState({
  keyboardListener,
  soundController,
  resetGlobalState,
  state,
}: {
  keyboardListener: KeyboardListener;
  soundController: SoundController;
  resetGlobalState: ResetGlobalState;
  state: MenuState;
}) {
  let selectedIndex = state.selectedIndex;

  const isSelect = keyboardListener.isDown(InputControl.Select);
  const isUp = keyboardListener.isDown(InputControl.Up);
  const isDown = keyboardListener.isDown(InputControl.Down);

  if (isSelect) {
    // Try again
    if (selectedIndex === 0) {
      soundController.stopAll();
      const newMenuState = {
        ...startPlaying({ state: defaultMenuState, soundController }),
        isAnyKey: false,
      };
      resetGlobalState({
        gotReset: true,
        menuState: newMenuState,
      });
      return newMenuState;
    }
    // Main menu
    if (selectedIndex === 1) {
      const newMenuState = {
        ...defaultMenuState,
        isAnyKey: false,
      };
      soundController.stopAll();
      resetGlobalState({
        gotReset: true,
        menuState: newMenuState,
      });
      return newMenuState;
    }
    return state;
  }

  if (isUp) {
    selectedIndex = Math.max(0, selectedIndex - 1);
  } else if (isDown) {
    selectedIndex = Math.min(GAME_OVER_ITEMS.length - 1, selectedIndex + 1);
  }
  if (isUp || isDown) {
    soundController.play(SOUND_MENU_FOCUS_ID);
  }

  return { ...state, selectedIndex };
}
