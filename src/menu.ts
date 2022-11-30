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
  ITCH_LINK,
  TSYD_LINK,
  MULT_OPTIONS,
  MULT,
  displayMult,
  setMult,
} from './config';
import { CarState } from './car';
import { KeyboardListener, InputControl } from './controls';
import { EndingState } from './ending';
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
  isWin: boolean;
  isCredits: boolean;
  isIntro: boolean; // TODO: local storage?
  introPassed: number;
  deathTimePassed: number;
  selectedIndex: number;
};

const INTRO_KEY = 'gimmeabreak.intro';
const SOUND_KEY = 'gimmeabreak.sound';

const savedHasWatchedIntro = localStorage.getItem(INTRO_KEY) === 'true';
const savedIsSoundOn = localStorage.getItem(SOUND_KEY) !== 'false';

const SKIP_FOR_DEV = false;

export const defaultMenuState: MenuState = {
  isOpen: SKIP_FOR_DEV ? false : true,
  isAnyKey: SKIP_FOR_DEV ? false : true,
  isSoundOn: savedIsSoundOn,
  isPlaying: false,
  isGameOver: false,
  isWin: false,
  isCredits: false,
  isIntro: false,
  introPassed: 0,
  deathTimePassed: 0,
  selectedIndex: 0,
};

type MenuItem = {
  id: string;
  label: string;
};

const MAIN_MENU_ITEMS: MenuItem[] = [
  { id: 'play', label: 'PLAY' },
  { id: 'speed', label: 'SPEED' },
  { id: 'sound', label: 'SOUND: ' },
  { id: 'credits', label: 'CREDITS' },
];
if (savedHasWatchedIntro) {
  MAIN_MENU_ITEMS.push({ id: 'intro', label: 'INTRO' });
}

const GAME_OVER_ITEMS: MenuItem[] = [
  { id: 'retry', label: 'TRY AGAIN' },
  { id: 'speed', label: 'SPEED' },
  { id: 'main', label: 'MAIN MENU' },
];

const WIN_ITEMS: MenuItem[] = [
  { id: 'credits', label: 'CREDITS' },
  { id: 'main', label: 'MAIN MENU' },
];

const CREDITS_ITEMS: MenuItem[] = [
  { id: 'heckx2', label: '  heckx2' },
  { id: 'tsyd', label: '   TSYD' },
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

  if (state.isIntro) {
    drawIntro(ctx, { lastTime, state, images });
    return;
  }

  if (state.isCredits) {
    drawCreditsMenu(ctx, { lastTime, state, images });
    return;
  }

  if (state.isWin) {
    drawWinMenu(ctx, { lastTime, state, images });
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
  const textY = 50 * RS;
  drawBigText(ctx, { text: 'GIMME A BRAKE', size: 30, x: textX, y: textY });

  if (!state.isPlaying) {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      ctx.font = `${7 * RS}px ${FONT_PRIMARY}`;
      ctx.fillStyle = '#666';
      ctx.fillText(
        'NOTE: MUSIC AND SOUNDS ARE NOT AVAILABLE IN SAFARI BROWSER',
        50 * RS,
        196 * RS,
      );
    }
  }

  const items = MAIN_MENU_ITEMS.filter((item) => {
    if (state.isPlaying && ['credits', 'intro'].includes(item.id)) {
      return false;
    }
    return true;
  });
  if (state.isPlaying) {
    items.push({ id: 'main', label: 'MAIN MENU' });
  }

  items.forEach((item, index) => {
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

function drawOverlay(ctx, opacity = 0.7) {
  const overlayWidth = 200 * RS;
  const overlayHeight = 150 * RS;

  ctx.fillStyle = '#444';
  ctx.globalAlpha = opacity;
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
    color = '#fff',
    selectColor = '#e42424',
    offX = 90,
    startY = 100,
    gapY = 22,
  }: {
    lastTime: number;
    images: ImageMap;
    state: MenuState;
    item: MenuItem;
    index: number;
    isSelected: boolean;
    color?: string;
    selectColor?: string;
    offX?: number;
    startY?: number;
    gapY?: number;
  },
) {
  const textX = (IW - offX * RS) / 2;
  const textY = startY * RS + gapY * RS * index;

  ctx.font = `${17 * RS}px ${FONT_PRIMARY}`;
  ctx.fillStyle = isSelected ? selectColor : color;

  let text = item.label;
  if (item.id === 'sound') {
    text += '' + (state.isSoundOn ? 'ON' : 'OFF');
  }
  if (item.id === 'speed') {
    text += ': x' + displayMult(MULT());
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

function drawWinMenu(
  ctx,
  {
    lastTime,
    state,
    images,
  }: { lastTime: number; state: MenuState; images: ImageMap },
) {
  drawOverlay(ctx);

  const textX = 120 * RS;
  const textY = 50 * RS;
  drawBigText(ctx, {
    text: 'YOU WON?',
    size: 25,
    x: textX,
    y: textY,
    fillStyle: '#15aa25',
  });

  WIN_ITEMS.forEach((item, index) => {
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

function drawCreditsMenu(
  ctx,
  {
    lastTime,
    state,
    images,
  }: { lastTime: number; state: MenuState; images: ImageMap },
) {
  drawOverlay(ctx);

  ctx.fillStyle = '#aaa';
  ctx.font = `${8 * RS}px ${FONT_PRIMARY}`;
  ctx.fillText('CODE + ART', 60 * RS, 48 * RS);

  ctx.fillStyle = '#aaa';
  ctx.font = `${6 * RS}px ${FONT_PRIMARY}`;
  ctx.fillText('(ITCH.IO)', 244 * RS, 50 * RS);

  ctx.fillStyle = '#aaa';
  ctx.font = `${8 * RS}px ${FONT_PRIMARY}`;
  ctx.fillText('MUSIC + SOUND', 42 * RS, 104 * RS);

  ctx.fillStyle = '#aaa';
  ctx.font = `${6 * RS}px ${FONT_PRIMARY}`;
  ctx.fillText('(INSTAGRAM.COM)', 225 * RS, 106 * RS);

  CREDITS_ITEMS.forEach((item, index) => {
    drawItem(ctx, {
      lastTime,
      images,
      state,
      item,
      index,
      isSelected: index === state.selectedIndex,
      selectColor: '#fff',
      color: '#999',
      startY: 50,
      gapY: 56,
    });
  });
}

export function updateMenuState({
  state,
  carState,
  speedState,
  endingState,
  deltaTime,
  keyboardListener,
  soundController,
  resetGlobalState,
}: {
  state: MenuState;
  carState: CarState;
  speedState: SpeedState;
  endingState: EndingState;
  deltaTime: number;
  keyboardListener: KeyboardListener;
  soundController: SoundController;
  resetGlobalState: ResetGlobalState;
}) {
  if (!state.isOpen) {
    // Ending
    if (!state.isWin && endingState.isDone) {
      keyboardListener.listen();
      soundController.play('win2');
      return {
        ...state,
        isWin: true,
        isOpen: true,
      };
    }

    // Observe speed state and car state for triggering death
    if (carState.flipTimePassed > 0 && speedState.moveSpeed === 0) {
      const deathTimePassed = state.deathTimePassed + deltaTime;

      // Trigger game over menu a bit later
      if (deathTimePassed > 1) {
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

  if (state.isIntro) {
    return updateIntroState({
      deltaTime,
      keyboardListener,
      soundController,
      state,
    });
  }

  // Credits screen
  if (state.isCredits) {
    return updateCreditsState({
      keyboardListener,
      soundController,
      state,
      resetGlobalState,
    });
  }

  // Win screen
  if (state.isWin) {
    return updateWinState({
      keyboardListener,
      soundController,
      state,
      resetGlobalState,
    });
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
    if (state.isPlaying) {
      if (selectedIndex === 0) {
        return returnToPlaying({ state, soundController });
      }
      if (selectedIndex === 1) {
        const index = MULT_OPTIONS.indexOf(MULT());
        let nextIndex = index + 1;
        if (nextIndex > MULT_OPTIONS.length - 1) {
          nextIndex = 0;
        }
        setMult(MULT_OPTIONS[nextIndex]);
        soundController.play(SOUND_MENU_SELECT_ID);
        return state;
      }
      if (selectedIndex === 2) {
        const isSoundOn = !state.isSoundOn;
        localStorage.setItem(SOUND_KEY, isSoundOn ? 'true' : 'false');
        soundController.setGlobalMuted(!isSoundOn);
        soundController.play(SOUND_MENU_SELECT_ID);

        return {
          ...state,
          isSoundOn,
        };
      }
      if (selectedIndex === 3) {
        const newMenuState = {
          ...defaultMenuState,
          isAnyKey: false,
        };
        soundController.play(SOUND_MENU_SELECT_ID);
        resetGlobalState({
          gotReset: true,
          menuState: newMenuState,
        });
        return newMenuState;
      }
    } else {
      if (selectedIndex === 0) {
        if (savedHasWatchedIntro) {
          soundController.play(SOUND_MENU_SELECT_ID);
          return startPlaying({ state, soundController });
        } else {
          localStorage.setItem(INTRO_KEY, 'true');
          soundController.stopAll();
          return { ...state, isIntro: true };
        }
      }
      if (selectedIndex === 1) {
        const index = MULT_OPTIONS.indexOf(MULT());
        let nextIndex = index + 1;
        if (nextIndex > MULT_OPTIONS.length - 1) {
          nextIndex = 0;
        }
        setMult(MULT_OPTIONS[nextIndex]);
        soundController.play(SOUND_MENU_SELECT_ID);
        return state;
      }
      if (selectedIndex === 2) {
        const isSoundOn = !state.isSoundOn;
        localStorage.setItem(SOUND_KEY, isSoundOn ? 'true' : 'false');
        soundController.setGlobalMuted(!isSoundOn);
        soundController.play(SOUND_MENU_SELECT_ID);

        return {
          ...state,
          isSoundOn,
        };
      }

      if (selectedIndex === 3) {
        soundController.play(SOUND_MENU_SELECT_ID);
        return {
          ...state,
          selectedIndex: 2,
          isCredits: true,
        };
      }

      if (selectedIndex === 4) {
        soundController.stopAll();
        soundController.play(SOUND_MENU_SELECT_ID);
        return {
          ...state,
          selectedIndex: 0,
          isIntro: true,
        };
      }
    }

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
  soundController.play('car');
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
  soundController.play('car');
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
      soundController.play(SOUND_MENU_SELECT_ID);
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
    if (selectedIndex === 1) {
      const index = MULT_OPTIONS.indexOf(MULT());
      let nextIndex = index + 1;
      if (nextIndex > MULT_OPTIONS.length - 1) {
        nextIndex = 0;
      }
      setMult(MULT_OPTIONS[nextIndex]);
      soundController.play(SOUND_MENU_SELECT_ID);
      return state;
    }
    // Main menu
    if (selectedIndex === 2) {
      const newMenuState = {
        ...defaultMenuState,
        isAnyKey: false,
      };
      soundController.stopAll();
      soundController.play(SOUND_MENU_SELECT_ID);
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

function updateWinState({
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
    // Credits
    if (selectedIndex === 0) {
      const newMenuState = {
        ...defaultMenuState,
        isAnyKey: false,
        isCredits: true,
        selectedIndex: 2,
      };
      soundController.stopAll();
      soundController.play(SOUND_MENU_SELECT_ID);
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
      soundController.play(SOUND_MENU_SELECT_ID);
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

function updateCreditsState({
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
    if (selectedIndex === 0) {
      window.open(ITCH_LINK);
      return state;
    }
    if (selectedIndex === 1) {
      window.open(TSYD_LINK);
      return state;
    }
    // Main menu
    if (selectedIndex === 2) {
      soundController.play(SOUND_MENU_SELECT_ID);
      return { ...state, isCredits: false, selectedIndex: 0 };
    }
  }

  if (isUp) {
    selectedIndex = Math.max(0, selectedIndex - 1);
  } else if (isDown) {
    selectedIndex = Math.min(CREDITS_ITEMS.length - 1, selectedIndex + 1);
  }
  if (isUp || isDown) {
    soundController.play(SOUND_MENU_FOCUS_ID);
  }
  return { ...state, selectedIndex };
}

function drawIntro(
  ctx,
  {
    lastTime,
    state,
    images,
  }: { lastTime: number; state: MenuState; images: ImageMap },
) {
  const sourceY = 0;
  const sourceWidth = 380;
  const sourceHeight = 200;
  const frameX = 0;
  const frameY = 0;
  const frameWidth = IW;
  const frameHeight = IH;

  let sourceX = 0;
  if (Math.round(lastTime / 0.1) % 2 === 0) {
    sourceX = sourceWidth;
  }

  const introSprite = images.intro;

  ctx.drawImage(
    introSprite,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
  );

  ctx.globalAlpha = 0.5;
  ctx.font = `${7 * RS}px ${FONT_PRIMARY}`;
  ctx.fillStyle = '#233459';
  ctx.fillText('SPACEBAR TO SKIP INTRO', 230 * RS, 195 * RS);
  ctx.globalAlpha = 1;

  if (state.introPassed > 5 && state.introPassed < 10) {
    const text = '... I hecking love my new auto-driving car';
    ctx.font = `${11 * RS}px ${FONT_PRIMARY}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(text, 30 * RS, 25 * RS);
    ctx.fillStyle = '#702142';
    ctx.fillText(text, 31 * RS, 26 * RS);
  }

  if (state.introPassed > 12) {
    ctx.fillStyle =
      Math.round(lastTime / 0.1) % 2 === 0 ? '#b32929' : '#bc4f4f';
    ctx.fillRect(147 * RS, 89 * RS, 78 * RS, 52 * RS);
  }

  if (state.introPassed > 12 && state.introPassed < 15) {
    ctx.font = `${8 * RS}px ${FONT_PRIMARY}`;
    ctx.fillStyle = '#fff';
    ctx.fillText('BRAKES', 155 * RS, 105 * RS);
    ctx.fillText('NOT ', 155 * RS, 115 * RS);
    ctx.fillText('RESPONDING', 155 * RS, 125 * RS);
  }

  if (state.introPassed > 16 && state.introPassed < 19) {
    ctx.font = `${8 * RS}px ${FONT_PRIMARY}`;
    ctx.fillStyle = '#fff';
    ctx.fillText('FULL', 155 * RS, 108 * RS);
    ctx.fillText('THROTTLE', 155 * RS, 118 * RS);
  }

  if (state.introPassed > 20) {
    ctx.font = `${8 * RS}px ${FONT_PRIMARY}`;
    ctx.fillStyle = '#fff';
    ctx.fillText('I', 155 * RS, 106 * RS);
    ctx.fillText('LOVE', 155 * RS, 116 * RS);
    ctx.fillText('DUCKS ^_^', 155 * RS, 126 * RS);
  }

  if (state.introPassed > 24) {
    const text = '... OH BOY, HOW DO I STOP IT !?!?';
    ctx.font = `${11 * RS}px ${FONT_PRIMARY}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(text, 40 * RS, 25 * RS);
    ctx.fillStyle = '#982d2d';
    ctx.fillText(text, 41 * RS, 26 * RS);
  }

  if (state.introPassed < 0.1) {
    drawOverlay(ctx, 0.7);
  } else if (state.introPassed < 0.2) {
    drawOverlay(ctx, 0.6);
  } else if (state.introPassed < 0.4) {
    drawOverlay(ctx, 0.5);
  } else if (state.introPassed < 0.6) {
    drawOverlay(ctx, 0.4);
  } else if (state.introPassed < 0.8) {
    drawOverlay(ctx, 0.3);
  } else if (state.introPassed < 1) {
    drawOverlay(ctx, 0.2);
  } else if (state.introPassed < 1.2) {
    drawOverlay(ctx, 0.1);
  }

  // if (state.introPassed > 27.2) {
  //   drawOverlay(ctx, 0.7);
  // } else if (state.introPassed > 27) {
  //   drawOverlay(ctx, 0.6);
  // } else if (state.introPassed > 26.8) {
  //   drawOverlay(ctx, 0.5);
  // } else if (state.introPassed > 26.6) {
  //   drawOverlay(ctx, 0.4);
  // } else if (state.introPassed > 26.4) {
  //   drawOverlay(ctx, 0.3);
  // } else if (state.introPassed > 26.2) {
  //   drawOverlay(ctx, 0.2);
  // } else if (state.introPassed > 26) {
  //   drawOverlay(ctx, 0.1);
  // }
}

function updateIntroState({
  state,
  deltaTime,
  keyboardListener,
  soundController,
}: {
  state: MenuState;
  deltaTime;
  keyboardListener: KeyboardListener;
  soundController: SoundController;
}) {
  const isSelect = keyboardListener.isDown(InputControl.Select);

  let introPassed = state.introPassed;

  if (introPassed < 12) {
    soundController.playCarIntro();
    soundController.playIfNotPlaying(SOUND_GAME_THEME_ID, 0.1);
  }

  introPassed += deltaTime;

  if (introPassed > 12 && introPassed < 14) {
    soundController.playIfNotPlaying('curb2');
    soundController.stop(SOUND_GAME_THEME_ID);
  }

  if (introPassed > 16 && introPassed < 18) {
    soundController.playIfNotPlaying('curb2');
  }

  if (introPassed > 20 && introPassed < 22) {
    soundController.playIfNotPlaying('curb2');
  }

  if (isSelect || introPassed > 28) {
    return startPlaying({
      state: { ...state, isIntro: false },
      soundController,
    });
  }

  return { ...state, introPassed };
}
