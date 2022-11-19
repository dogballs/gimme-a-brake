import { IW, IH, HH, BG_SPEED_PER_MOVE_OFFSET, MOVE_SPEED_MAX } from './config';
import { Section } from './section';
import { Context2D } from './types';

export function drawBackground(
  ctx: Context2D,
  {
    bgImage,
    bgOffset,
    yOverride,
  }: {
    bgImage: HTMLImageElement;
    bgOffset: number;
    yOverride?: number;
  },
) {
  const offsetX = bgOffset % bgImage.width;
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

  ctx.globalAlpha = 0.7;

  ctx.drawImage(
    bgImage,
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
    const newSourceX = bgImage.width - overflow;
    const newSourceWidth = overflow;
    const newDestWidth = overflow;

    ctx.drawImage(
      bgImage,
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

  if (sourceX > bgImage.width - IW) {
    const overflow = sourceX - (bgImage.width - IW);
    const newSourceX = 0;
    const newSourceWidth = overflow;
    const newDestX = IW - overflow;
    const newDestWidth = overflow;

    ctx.drawImage(
      bgImage,
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
