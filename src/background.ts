import { IW, IH, HH, BG_SPEED_PER_MOVE_OFFSET } from './config';
import { ImageMap } from './images';
import { Section } from './section';
import { generateStripes, stripesUnscaledHeight } from './stripes';
import { Zone, ZoneKind } from './zone';
import { Context2D } from './types';

export function drawBackground(
  ctx: Context2D,
  {
    images,
    zone,
    nextZone,
    bgOffset,
    moveOffset,
    yOverride,
  }: {
    images: ImageMap;
    zone: Zone;
    nextZone: Zone;
    moveOffset: number;
    bgOffset: number;
    yOverride?: number;
  },
) {
  const nextZoneIn = nextZone.start - moveOffset;

  const roadHeight = IH - (yOverride ?? HH);
  const stripes = generateStripes({ roadHeight });
  const roadDepth = stripesUnscaledHeight(stripes);

  const activeImage = imageByZoneKind(images, zone.kind);
  let activeOpacity = 1;

  if (nextZoneIn > 0 && nextZoneIn < roadDepth && nextZone.kind !== zone.kind) {
    const inOffset = roadDepth - nextZoneIn;
    activeOpacity = 1 - inOffset / roadDepth;
  }

  drawBackgroundImage(ctx, {
    image: activeImage,
    opacity: activeOpacity,
    bgOffset,
    yOverride,
  });

  if (activeOpacity !== 1) {
    const nextImage = imageByZoneKind(images, nextZone.kind);
    const nextOpacity = 1 - activeOpacity;

    const secondaryImage = drawBackgroundImage(ctx, {
      image: nextImage,
      opacity: nextOpacity,
      bgOffset,
      yOverride,
    });
  }
}

function drawBackgroundImage(
  ctx,
  {
    image,
    opacity,
    bgOffset,
    yOverride,
  }: {
    image: HTMLImageElement;
    opacity: number;
    bgOffset: number;
    yOverride?: number;
  },
) {
  const offsetX = bgOffset % image.width;
  const offsetY = 0;

  const horizonOffsetY = (yOverride ?? HH) - HH;

  // TODO: make it depend on the steepness of the hill
  let parallaxMult = 1;
  if (horizonOffsetY > 0) {
    // looking up
    parallaxMult = 0.4;
  } else if (horizonOffsetY < 0) {
    // looking down
    parallaxMult = 0.7;
  }

  const sourceOffsetY = 25;
  const parallaxY = horizonOffsetY * parallaxMult;

  const sourceX = offsetX;
  const sourceY = sourceOffsetY - parallaxY;
  const sourceWidth = IW;
  const sourceHeight = yOverride ?? HH;
  const destX = 0;
  const destY = 0;
  const destWidth = IW;
  const destHeight = yOverride ?? HH;

  ctx.globalAlpha = opacity;

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    destX,
    destY,
    destWidth,
    destHeight,
  );

  if (sourceX < 0) {
    const overflow = Math.abs(sourceX);
    const newSourceX = image.width - overflow;
    const newSourceWidth = overflow;
    const newDestWidth = overflow;

    ctx.drawImage(
      image,
      newSourceX,
      sourceY,
      newSourceWidth,
      sourceHeight,
      destX,
      destY,
      newDestWidth,
      destHeight,
    );
  }

  if (sourceX > image.width - IW) {
    const overflow = sourceX - (image.width - IW);
    const newSourceX = 0;
    const newSourceWidth = overflow;
    const newDestX = IW - overflow;
    const newDestWidth = overflow;

    ctx.drawImage(
      image,
      newSourceX,
      sourceY,
      newSourceWidth,
      sourceHeight,
      newDestX,
      destY,
      newDestWidth,
      destHeight,
    );
  }

  ctx.globalAlpha = 1;
}

function imageByZoneKind(images: ImageMap, kind: ZoneKind) {
  switch (kind) {
    case 'green':
      return images.bgGreen;
    case 'desert':
      return images.bgDesert;
    case 'forest':
      return images.bgForest;
    case 'beach':
      return images.bgBeach;
    default:
      throw new Error(`Unsupported bg zone kind: "${kind}"`);
  }
}

export function updateBackgroundOffset({
  section,
  bgOffset,
  moveOffset,
  moveOffsetChange,
  moveSpeed,
}: {
  section: Section;
  bgOffset: number;
  moveOffset: number;
  moveOffsetChange: number;
  moveSpeed: number;
}) {
  const entryGap = 200;

  if (moveSpeed > 0) {
    const inSectionOffset = moveOffset - section.start;
    const bgOffsetChange = moveOffsetChange * BG_SPEED_PER_MOVE_OFFSET;

    if (section.kind === 'turn-left' && inSectionOffset > entryGap) {
      return bgOffset - bgOffsetChange;
    }
    if (section.kind === 'turn-right' && inSectionOffset > entryGap) {
      return bgOffset + bgOffsetChange;
    }
  }

  return bgOffset;
}
