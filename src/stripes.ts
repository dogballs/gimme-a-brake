import { IW, IH, HH } from './config';
import { Context2D } from './types';

type DrawStripesOpts = {
  moveOffset: number;
  yOverride?: number;
};
type DrawStripesColors = [string, string];

export function drawGroundStripes(ctx: Context2D, opts: DrawStripesOpts) {
  const colors: DrawStripesColors = ['#889827', '#9aa545'];
  drawStripes(ctx, { ...opts, colors });
}

export function drawRoadStripes(ctx: Context2D, opts: DrawStripesOpts) {
  const colors: DrawStripesColors = ['#69696a', '#444446'];
  drawStripes(ctx, { ...opts, colors });
}

// TODO: make them appear more often?? but keep stripes match with bigger ones
export function drawCurbStripes(ctx: Context2D, opts: DrawStripesOpts) {
  const colors: DrawStripesColors = ['#c5bfbf', '#dc3961'];
  drawStripes(ctx, { ...opts, colors });
}

function drawStripes(
  ctx: Context2D,
  {
    colors,
    moveOffset,
    yOverride,
  }: {
    colors: DrawStripesColors;
  } & DrawStripesOpts,
) {
  const roadHeight = IH - (yOverride ?? HH);

  const speedEffectMultiplier = 2;
  const spedUpMoveOffset = moveOffset * speedEffectMultiplier;

  const stripes = calculateStripes({
    roadHeight,
    moveOffset: spedUpMoveOffset,
  });

  for (const stripe of stripes) {
    ctx.fillStyle = colors[stripe.textureIndex];
    ctx.fillRect(0, IH - stripe.y2, IW, stripe.height);
  }
}

function calculateStripes({
  roadHeight,
  moveOffset,
  nearTextureHeight = 32,
}: {
  roadHeight: number;
  moveOffset: number;
  nearTextureHeight?: number;
}) {
  const stripes = [];

  const isNegativeMoveOffset = moveOffset < 0;

  // Will be used in a function to calculate how much the next road stripe will
  // be downscaled compared to the previous one because next stripe is further
  // into the road.
  let downscaleIndex = 1;

  // Based on the nearest stripe and global offset calculate how much this
  // nearest stripe is offset from zero position. We are going to offset
  // all of the following stripes based on the same percentages.
  let restFillPercent =
    Math.abs(moveOffset % nearTextureHeight) / nearTextureHeight;
  let primFillPercent = 1 - restFillPercent;

  // If we are going below zero swap the percentages because the other texture
  // will be rendered first
  if (isNegativeMoveOffset) {
    primFillPercent = 1 - primFillPercent;
    restFillPercent = 1 - restFillPercent;
  }

  // Figure out which texture is rendered first in the current loop based on the
  // global offset
  let primTextureIndex =
    Math.floor(Math.abs(moveOffset) / nearTextureHeight) % 2;
  // If we are going negative choose the other texture
  if (isNegativeMoveOffset) {
    primTextureIndex = 1 - primTextureIndex;
  }

  let currentY = 0;
  let roadLeftToParse = roadHeight;

  while (roadLeftToParse >= 0) {
    const downscaleMultiplier = 1 / downscaleIndex;
    const stripeHeight = Math.ceil(downscaleMultiplier * nearTextureHeight);

    // Segment is split into two sub-segments based on the global offset.
    // Each segment has it's own texture.
    const primTextureHeight = Math.round(stripeHeight * primFillPercent);
    const restTextureHeight = Math.round(stripeHeight - primTextureHeight);

    // Add both sub-segments as separate entries of their own height with
    // corresponding texture indexes
    if (primTextureHeight !== 0) {
      const y = currentY;

      // 1. Make sure the stripes don't go over the total available height
      // 2. Make sure min stripe height is 1px, otherwise it will create a lot
      // of useless stripes that will blink during fast re-rendering
      let y2 = currentY + primTextureHeight;
      let height = Math.max(1, primTextureHeight);
      let heightOverflow = 0;
      if (y2 > roadHeight) {
        heightOverflow = y2 - roadHeight;
        y2 = roadHeight;
        height = Math.max(1, height - heightOverflow);
      }

      stripes.push({
        y,
        y2,
        height,
        textureIndex: primTextureIndex,
      });
    }
    if (restTextureHeight !== 0) {
      const y = currentY + primTextureHeight;
      if (y < roadHeight) {
        let y2 = currentY + stripeHeight;
        let height = Math.max(1, restTextureHeight);
        let heightOverflow = 0;
        if (y2 > roadHeight) {
          heightOverflow = y2 - roadHeight;
          y2 = roadHeight;
          height = Math.max(1, height - heightOverflow);
        }

        stripes.push({
          y,
          y2,
          height,
          textureIndex: 1 - primTextureIndex,
        });
      }
    }

    roadLeftToParse -= stripeHeight;
    currentY += stripeHeight;
    downscaleIndex++;
    // Alernate to the other texture and make it primary
    primTextureIndex = 1 - primTextureIndex;
  }

  return stripes;
}
