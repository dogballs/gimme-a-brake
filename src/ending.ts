import { IW, RS } from './config';
import { KeyboardListener } from './controls';
import { ImageMap } from './images';
import { SoundController } from './sound';
import { Zone } from './zone';
import { Context2D } from './types';

export type EndingState = {
  isInitiated: boolean;
  isLight: boolean;
  isSteerDone: boolean;
  isCarGone: boolean;
  initiatedPassed: number;
  isDone: boolean;
  lightPassed: number;
};

export const defaultEndingState: EndingState = {
  isInitiated: false,
  isLight: false,
  isSteerDone: false,
  isCarGone: false,
  initiatedPassed: 0,
  isDone: false,
  lightPassed: 0,
};

export function drawEnding(
  ctx: Context2D,
  {
    images,
    state,
  }: {
    images: ImageMap;
    state: EndingState;
  },
) {
  const { lightPassed, initiatedPassed } = state;

  if (lightPassed === 0) {
    return;
  }

  let lightIndex = Math.min(9, Math.round(lightPassed * 2));

  let changeAlpha = Math.round(lightPassed / 0.05) % 2 === 0;
  if (lightIndex >= 9) {
    changeAlpha = false;
  }

  if (lightPassed > 5) {
    lightIndex = 0;
  }

  if (lightPassed > 5) {
    lightIndex = -1;
  }

  if (lightIndex === -1) {
    if (initiatedPassed > 14) {
      const ufoImage = images.ufo;

      let scale = 1;
      if (initiatedPassed > 22) {
        scale = Math.max(0, 1 - (initiatedPassed - 22) / 1);
      }

      ctx.globalAlpha =
        Math.round(initiatedPassed / 0.05) % 2 === 0 ? 0.2 : 0.1;
      ctx.drawImage(
        ufoImage,
        100,
        100,
        ufoImage.width * scale,
        ufoImage.height * scale,
      );
      ctx.globalAlpha = 1;
    }

    return;
  }

  const frameWidth = 140;
  const frameHeight = 200;
  const frameX = lightIndex * frameWidth;
  const frameY = 0;

  const lightImage = images.ufoLight;

  const destWidth = frameWidth * RS;
  const destHeight = frameHeight * RS;
  const destX = (IW - destWidth) / 2;
  const destY = 0;

  if (changeAlpha) {
    ctx.globalAlpha = 0.5;
  }

  ctx.drawImage(
    lightImage,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    destX,
    destY,
    destWidth,
    destHeight,
  );

  ctx.globalAlpha = 1;
}

export function updateEndingState({
  keyboardListener,
  soundController,
  deltaTime,
  zone,
  state,
}: {
  keyboardListener: KeyboardListener;
  soundController: SoundController;
  deltaTime: number;
  zone: Zone;
  state: EndingState;
}): EndingState {
  let lightPassed = state.lightPassed;
  let initiatedPassed = state.initiatedPassed;
  let isCarGone = state.isCarGone;
  let isLight = state.isLight;
  let isDone = state.isDone;

  if (zone.isEnding && !state.isInitiated) {
    soundController.play('ufo4');
    keyboardListener.unlisten();
    return {
      ...state,
      isInitiated: true,
    };
  }

  if (!state.isInitiated) {
    return state;
  }

  initiatedPassed += deltaTime;

  if (!isLight) {
    if (initiatedPassed > 5) {
      soundController.stop('theme1');
      soundController.play('ufo3');
      return {
        ...state,
        initiatedPassed,
        isLight: true,
      };
    }

    return {
      ...state,
      initiatedPassed,
    };
  }

  if (!isCarGone) {
    lightPassed += deltaTime;
    if (lightPassed > 5) {
      isCarGone = true;
      soundController.stop('car');
      soundController.play('ufo1');
    }
  }

  if (!isDone) {
    if (initiatedPassed > 26) {
      return {
        ...state,
        isDone: true,
      };
    }
  }

  return {
    ...state,
    lightPassed,
    initiatedPassed,
    isCarGone,
  };
}
