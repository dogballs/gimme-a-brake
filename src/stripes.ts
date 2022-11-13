import { IW, IH, HH, RENDER_SCALE } from './config';
import { Context2D } from './types';

type DrawStripesOpts = {
  moveOffset: number;
  yOverride?: number;
};
type DrawStripesColors = [string, string];

type Stripe = {
  height: number;
  y: number;
  y2: number;
};

type TexturedStripe = Stripe & {
  textureIndex: number;
};

// It messes with the offsets but fixes weird transitions for uphill/downhill
// when the stripes are not moving.
// TODO: figure out another way to move stripes
const SPEED_EFFECT_MULTIPLIER = 1;

const NEAR_TEXTURE_HEIGHT = 32 * RENDER_SCALE;

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
  // const roadHeight = HH;

  const spedUpMoveOffset = moveOffset * SPEED_EFFECT_MULTIPLIER;

  const stripes = generateStripes({ roadHeight });
  const texturedStripes = textureSplitStripes(stripes, {
    moveOffset: spedUpMoveOffset,
  });

  for (const stripe of texturedStripes) {
    ctx.fillStyle = colors[stripe.textureIndex];
    ctx.fillRect(0, IH - stripe.y2, IW, stripe.height);
  }
}

export function stripesUnscaledHeight(stripes: Stripe[]) {
  const nearTextureHeight = stripes[0].height;
  return stripes.length * nearTextureHeight;
}

export function stripesToY(
  stripes: Stripe[],
  { inOffset }: { inOffset: number },
) {
  // First stripe travels 1 to 1 with the move offset -> 32 to 32.
  // Let's say second stripe is smaller in size by 2 (32 / 2 = 16), which means
  // that if inOffset travels +32, then this stripe will travel +16,
  // or if inOffset travels +16, then this stripe will travel +8.
  // Find a stripe we are in first using inOffset. Then figure out how much
  // into a stripe we have travelled and return it as an y position.
  const nearTextureHeight = stripes[0].height;
  const roadHeight = stripes[stripes.length - 1].y2;

  let unscaledOffset = 0;
  let scaledY = 0;

  const unscaledHeight = stripes.length * nearTextureHeight;
  const unscaledIn = unscaledHeight - inOffset * SPEED_EFFECT_MULTIPLIER;
  const unscaledT = unscaledIn / nearTextureHeight;

  const stripeIndex = Math.floor(unscaledT);
  const inStripeT = unscaledT % 1;

  if (stripeIndex < 0) {
    const firstStripe = stripes[0];
    return undefined;
    // return firstStripe.y2;
  }

  if (stripeIndex > stripes.length - 1) {
    const lastStripe = stripes[stripes.length - 1];
    return undefined;
    // return lastStripe.y2;
  }

  const stripe = stripes[stripeIndex];

  const y = stripe.y + stripe.height * inStripeT;

  return y;
}

export function generateStripes({
  roadHeight,
  nearTextureHeight = NEAR_TEXTURE_HEIGHT,
}: {
  roadHeight: number;
  nearTextureHeight?: number;
}): Stripe[] {
  const stripes: Stripe[] = [];

  // Will be used in a function to calculate how much the next road stripe will
  // be downscaled compared to the previous one because next stripe is further
  // into the road.
  let downscaleIndex = 1;

  let currentY = 0;
  let roadLeftToParse = roadHeight;

  while (roadLeftToParse >= 0) {
    const y = currentY;
    if (y >= roadHeight) {
      break;
    }

    const downscaleMultiplier = 1 / downscaleIndex;
    const stripeHeight = Math.ceil(downscaleMultiplier * nearTextureHeight);

    let y2 = y + stripeHeight;
    let height = stripeHeight;

    if (y2 > roadHeight) {
      y2 = roadHeight;
      height = Math.round(y2 - y);
    }

    if (height > 0) {
      stripes.push({
        y,
        y2,
        height,
      });
    }

    roadLeftToParse -= stripeHeight;
    currentY += stripeHeight;
    downscaleIndex++;
  }
  return stripes;
}

// TODO: allow custom texture count, not just two, to split the curb
function textureSplitStripes(
  stripes: Stripe[],
  {
    moveOffset,
  }: {
    moveOffset: number;
  },
) {
  const splitStripes: TexturedStripe[] = [];

  if (stripes.length === 0) {
    return splitStripes;
  }

  const isNegativeMoveOffset = moveOffset < 0;
  const nearTextureHeight = stripes[0].height;

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

  for (const stripe of stripes) {
    // Stripe is split into two sub-stripes based on the global offset.
    // Each stripe has it's own texture.
    const primTextureHeight = Math.round(stripe.height * primFillPercent);
    const restTextureHeight = stripe.height - primTextureHeight;

    // Add both sub-stripes as separate entries of their own height with
    // corresponding texture indexes
    if (primTextureHeight !== 0) {
      splitStripes.push({
        ...stripe,
        height: primTextureHeight,
        y2: stripe.y + primTextureHeight,
        textureIndex: primTextureIndex,
      });
    }
    if (restTextureHeight !== 0) {
      splitStripes.push({
        ...stripe,
        height: restTextureHeight,
        y: stripe.y2 - restTextureHeight,
        textureIndex: 1 - primTextureIndex,
      });
    }

    // Alernate to the other texture and make it primary
    primTextureIndex = 1 - primTextureIndex;
  }

  return splitStripes;
}
