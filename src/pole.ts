import { IH, HH, RENDER_SCALE } from './config';
import { drawCurve, curveXByY, steerCurve } from './curve';
import { ImageMap } from './images';
import { Path } from './path';
import { getCurbPath } from './road';
import { generateStripes, stripesToY, stripesUnscaledHeight } from './stripes';
import { Zone } from './zone';

export type Pole = {
  start: number;
  granted: boolean;
  energyFrameTime?: number;
  energyFrameIndex?: number;
};

export function drawPoles(
  ctx,
  {
    poles,
    images,
    deltaTime,
    path,
    zone,
    nextZone,
    moveOffset,
    steerOffset,
    yOverride,
  }: {
    poles: Pole[];
    images: ImageMap;
    deltaTime: number;
    path: Path;
    zone: Zone;
    nextZone: Zone;
    moveOffset: number;
    steerOffset: number;
    yOverride?: number;
  },
) {
  let roadHeight = IH - (yOverride ?? HH);
  const stripes = generateStripes({ roadHeight });
  const travelDistance = stripesUnscaledHeight(stripes);

  let preshowSize = 200;

  const pole = poles.find((pole) => {
    const appearStart = pole.start - travelDistance;
    const preshowAppearStart = appearStart - preshowSize;
    return moveOffset >= preshowAppearStart;
  });

  if (!pole) {
    return;
  }

  const appearStart = pole.start - travelDistance;
  const isPreshow = moveOffset < appearStart;

  const curbPath = getCurbPath(path, { steerOffset });

  let inOffset = moveOffset - pole.start + travelDistance;
  if (isPreshow) {
    inOffset = 1;
  }

  const stripesY = stripesToY(stripes, { inOffset });
  if (stripesY === undefined) {
    return;
  }

  const poleY = IH - stripesY;

  const poleRightX = curveXByY(
    steerCurve(curbPath.right, { steerOffset }),
    poleY,
  );
  const poleLeftX = curveXByY(
    steerCurve(curbPath.left, { steerOffset }),
    poleY,
  );

  let inHalfHeightT = stripesY / HH;

  let imageScale = Math.max(0, 1 - (1 - 0.1 * RENDER_SCALE) * inHalfHeightT);
  let imageOpacity = 1;

  if (poleRightX) {
    drawPole(ctx, {
      side: 'right',
      images,
      pole,
      poleX: poleRightX,
      poleY,
      imageScale,
      imageOpacity,
    });
  }

  if (poleLeftX) {
    drawPole(ctx, {
      side: 'left',
      images,
      pole,
      poleX: poleLeftX,
      poleY,
      imageScale,
      imageOpacity,
    });
  }
}

function drawPole(
  ctx,
  {
    side,
    images,
    pole,
    poleX,
    poleY,
    imageScale,
    imageOpacity,
  }: {
    side: 'left' | 'right';
    images: ImageMap;
    pole: Pole;
    poleX: number;
    poleY: number;
    imageScale: number;
    imageOpacity: number;
  },
) {
  const image = images.pole;

  const sourceWidth = 64;
  const sourceHeight = 256;
  const sourceX = pole.granted ? 64 : 0;
  const sourceY = 0;

  const imageWidth = sourceWidth * imageScale;
  const imageHeight = sourceHeight * imageScale;
  const imageX = poleX - imageWidth / 3;
  const imageY = poleY - imageHeight;

  ctx.globalAlpha = imageOpacity;
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    imageX,
    imageY,
    imageWidth,
    imageHeight,
  );
  ctx.globalAlpha = 1;

  const animationEnd = 1;

  if (!pole.granted) {
    if (pole.energyFrameTime == null) {
      pole.energyFrameTime = 0;
      pole.energyFrameIndex = 0;
    } else {
      pole.energyFrameTime += 0.1;
    }

    if (pole.energyFrameTime >= animationEnd) {
      pole.energyFrameTime = 0;
      pole.energyFrameIndex = pole.energyFrameIndex === 0 ? 1 : 0;
    }

    const energyImage = images.poleEnergy;

    const energyWidth = energyImage.width * imageScale * 1.5;

    const energyHeight = energyImage.height * imageScale;
    const energyX = side === 'right' ? imageX - energyWidth : imageX + 20;
    const energyY = imageY;

    if (pole.energyFrameIndex === 1) {
      ctx.globalAlpha = pole.energyFrameTime / animationEnd;
    }
    ctx.drawImage(energyImage, energyX, energyY, energyWidth, energyHeight);
    ctx.globalAlpha = 1;
  }
}

export function generatePolesForZones() {}
