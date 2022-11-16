import { HH, IH } from './config';
import { Stripe, stripesToY } from './stripes';
import { Context2D } from './types';

export type CollisionBox = {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
};

export function findCollisions(
  sourceBox: CollisionBox,
  targetBoxes: CollisionBox[],
): number[] {
  const targetIndexes: number[] = [];

  for (let i = 0; i < targetBoxes.length; i++) {
    const targetBox = targetBoxes[i];

    const intersects =
      sourceBox.x < targetBox.x + targetBox.width &&
      sourceBox.x + sourceBox.width > targetBox.x &&
      sourceBox.y < targetBox.y + targetBox.height &&
      sourceBox.y + sourceBox.height > targetBox.y &&
      sourceBox.z < targetBox.z + targetBox.depth &&
      sourceBox.z + sourceBox.depth > targetBox.z;

    if (intersects) {
      targetIndexes.push(i);
    }
  }

  return targetIndexes;
}

export function drawCollisionBoxes(
  ctx: Context2D,
  collidedBoxes: CollisionBox[],
  uncollidedBoxes: CollisionBox[],
  { stripes, roadDepth }: { stripes: Stripe[]; roadDepth: number },
) {
  drawBoxes(ctx, uncollidedBoxes, {
    boxColor: 'lightgreen',
    depthColor: 'green',
    stripes,
    roadDepth,
  });

  drawBoxes(ctx, collidedBoxes, {
    boxColor: 'orange',
    depthColor: 'red',
    stripes,
    roadDepth,
  });
}

function drawBoxes(
  ctx,
  boxes: CollisionBox[],
  {
    boxColor,
    depthColor,
    stripes,
    roadDepth,
  }: {
    boxColor: string;
    depthColor: string;
    stripes: Stripe[];
    roadDepth: number;
  },
) {
  for (const box of boxes) {
    ctx.strokeStyle = boxColor;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    ctx.strokeStyle = depthColor;
    const zy = stripesToY(stripes, { inOffset: roadDepth - box.z });
    if (!zy) {
      // console.log('zy not found: ', box.z);
      continue;
    }
    const zy2 = stripesToY(stripes, {
      inOffset: roadDepth - box.z - box.depth,
    });
    if (!zy2) {
      // console.log('zy2 not found', box.z, box.depth);
      continue;
    }

    const bottomZ = IH - zy;
    const topZ = IH - zy2;
    const zHeight = bottomZ - topZ;

    ctx.strokeRect(box.x, topZ, box.width, zHeight);
  }
}
