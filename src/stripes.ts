import { IW, IH, HH, RENDER_SCALE } from './config';
import { Zone, ZoneKind } from './zone';
import { Context2D } from './types';

type DrawStripesOpts = {
  zone: Zone;
  nextZone: Zone;
  moveOffset: number;
  yOverride?: number;
};
type DrawStripesColors = [string, string];

export type Stripe = {
  height: number;
  y: number;
  y2: number;
  stripeIndex: number;
};

type TexturedStripe = Stripe & {
  textureIndex: number;
};

const NEAR_TEXTURE_HEIGHT = 32 * RENDER_SCALE;

const GROUND_COLORS = new Map<ZoneKind, DrawStripesColors>();
GROUND_COLORS.set('green', ['#889827', '#9aa545']);
GROUND_COLORS.set('desert', ['#b7b467', '#c9c67c']);
GROUND_COLORS.set('forest', ['#0c405e', '#1e4f6b']);
GROUND_COLORS.set('beach', ['#579eb7', '#579eb7']);

export function drawGroundStripes(ctx: Context2D, opts: DrawStripesOpts) {
  const colors = GROUND_COLORS.get(opts.zone.kind);
  drawStripes(ctx, { ...opts, colorMap: GROUND_COLORS });
}

const ROAD_COLORS = new Map<ZoneKind, DrawStripesColors>();
ROAD_COLORS.set('green', ['#69696a', '#444446']);
ROAD_COLORS.set('desert', ['#9d7634', '#8b6b36']);
ROAD_COLORS.set('forest', ['#497d7a', '#2f706c']);
ROAD_COLORS.set('beach', ['#36291a', '#4c3821']);

export function drawRoadStripes(ctx: Context2D, opts: DrawStripesOpts) {
  const colors = ROAD_COLORS.get(opts.zone.kind);
  drawStripes(ctx, { ...opts, colorMap: ROAD_COLORS });
}

const CURB_COLORS = new Map<ZoneKind, DrawStripesColors>();
CURB_COLORS.set('green', ['#c5bfbf', '#dc3961']);
CURB_COLORS.set('desert', ['#c57f4c', '#a15541']);
CURB_COLORS.set('forest', ['#867794', '#64497d']);
CURB_COLORS.set('beach', ['#626262', '#626262']);

// TODO: make them appear more often?? but keep stripes match with bigger ones
export function drawCurbStripes(ctx: Context2D, opts: DrawStripesOpts) {
  drawStripes(ctx, { ...opts, colorMap: CURB_COLORS });
}

function drawStripes(
  ctx: Context2D,
  {
    colorMap,
    zone,
    nextZone,
    moveOffset,
    yOverride,
  }: {
    colorMap: Map<ZoneKind, DrawStripesColors>;
  } & DrawStripesOpts,
) {
  const colors = colorMap.get(zone.kind);
  const nextColors = colorMap.get(nextZone.kind);

  const roadHeight = IH - (yOverride ?? HH);
  // const roadHeight = HH;

  const nextZoneIn = nextZone.start - moveOffset;

  const stripes = generateStripes({ roadHeight });
  const texturedStripes = textureSplitStripes(stripes, { moveOffset });
  const roadDepth = stripesUnscaledHeight(stripes);

  if (nextZoneIn > 0 && nextZoneIn < roadDepth) {
    console.log('inside');
    const inOffset = roadDepth - nextZoneIn;
    const divideY = stripesToY(stripes, { inOffset });

    const closestStripe = texturedStripes.find((stripe, i) => {
      return (
        stripe.y2 >= divideY &&
        stripe.textureIndex === 0 &&
        texturedStripes[i + 1]?.textureIndex !== 0
      );
    });

    for (let i = 0; i < texturedStripes.length; i++) {
      const stripe = texturedStripes[i];
      const nextStripe = texturedStripes[i + 1];

      let usedColors = colors;
      if (stripe.stripeIndex >= closestStripe?.stripeIndex) {
        usedColors = nextColors;
      }
      if (
        stripe.stripeIndex + 1 === closestStripe?.stripeIndex &&
        stripe.textureIndex === nextStripe?.textureIndex &&
        stripe.textureIndex === 0
      ) {
        usedColors = nextColors;
      }

      ctx.fillStyle = usedColors[stripe.textureIndex];
      ctx.fillRect(0, IH - stripe.y2, IW, stripe.height);
    }
  } else {
    for (const stripe of texturedStripes) {
      ctx.fillStyle = colors[stripe.textureIndex];
      ctx.fillRect(0, IH - stripe.y2, IW, stripe.height);
    }
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
  const unscaledIn = unscaledHeight - inOffset;
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
  if (stripe == null) {
    return undefined;
  }

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

  let stripeIndex = 0;

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
        stripeIndex,
      });
    }

    roadLeftToParse -= stripeHeight;
    currentY += stripeHeight;
    downscaleIndex++;
    stripeIndex++;
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

  let stripeIndex = 0;
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
        stripeIndex,
      });
    }
    if (restTextureHeight !== 0) {
      splitStripes.push({
        ...stripe,
        height: restTextureHeight,
        y: stripe.y2 - restTextureHeight,
        textureIndex: 1 - primTextureIndex,
        stripeIndex,
      });
    }

    // Alernate to the other texture and make it primary
    primTextureIndex = 1 - primTextureIndex;
    stripeIndex++;
  }

  return splitStripes;
}
