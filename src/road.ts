import { IH } from './config';
import { Context2D, PathDescriptor } from './types';

// Line equation:
// left: 5x + 18y = 2700
// right: 18 y - 5 x = 800

const DEFAULT_BOTTOM_LEFT_X = -180;
const DEFAULT_BOTTOM_RIGHT_X = 560;

type DrawRoadOpts = {
  moveOffset: number;
  steerOffset: number;
  color?: string;
};

export function drawRoadMask(
  ctx: Context2D,
  path: PathDescriptor,
  { steerOffset, color = 'black' }: Omit<DrawRoadOpts, 'moveOffset'>,
) {
  const { left, right, bottomLeft, bottomRight } = applySteerOffset(path, {
    steerOffset,
  });

  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(...bottomLeft);
  ctx.quadraticCurveTo(...left);
  ctx.lineTo(right[2], right[3]);
  ctx.quadraticCurveTo(right[0], right[1], ...bottomRight);
  ctx.lineTo(...bottomLeft);
  ctx.fill();
}

export function drawCurbMask(
  ctx: Context2D,
  path: PathDescriptor,
  { steerOffset, color = 'black' }: Omit<DrawRoadOpts, 'moveOffset'>,
) {
  const topWidth = 10;
  const bottomWidth = 40;

  const steeredPath = applySteerOffset(path, {
    steerOffset,
  });
  const { left, right, bottomLeft, bottomRight } = applyCurbAddons(
    steeredPath,
    {
      topAddon: 1,
      bottomAddon: 50,
    },
  );

  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(...bottomLeft);
  ctx.quadraticCurveTo(...left);
  ctx.lineTo(right[2], right[3]);
  ctx.quadraticCurveTo(right[0], right[1], ...bottomRight);
  ctx.lineTo(...bottomLeft);
  ctx.fill();
}

export function drawRoadLines(
  ctx: Context2D,
  path: PathDescriptor,
  { moveOffset, steerOffset, color = 'red' }: DrawRoadOpts,
) {
  ctx.strokeStyle = color;
  ctx.setLineDash([10]);
  ctx.lineDashOffset = moveOffset;

  const { left, right, bottomLeft, bottomRight } = applySteerOffset(path, {
    steerOffset,
  });

  ctx.beginPath();
  ctx.moveTo(...bottomLeft);
  ctx.quadraticCurveTo(...left);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(...bottomRight);
  ctx.quadraticCurveTo(...right);
  ctx.stroke();
}

function applySteerOffset(
  path: PathDescriptor,
  { steerOffset }: { steerOffset: number },
): PathDescriptor {
  const [bottomLeftX] = path.bottomLeft || [];
  const [bottomRightX] = path.bottomRight || [];

  const adjustedSteerOffset = steerOffset * 1;

  const newBottomLeftX =
    (bottomLeftX ?? DEFAULT_BOTTOM_LEFT_X) + adjustedSteerOffset;
  const newBottomRightX =
    (bottomRightX ?? DEFAULT_BOTTOM_RIGHT_X) + adjustedSteerOffset;

  return {
    ...path,
    bottomLeft: [newBottomLeftX, IH],
    bottomRight: [newBottomRightX, IH],
  };
}

function applyCurbAddons(
  path: PathDescriptor,
  {
    topAddon,
    bottomAddon,
  }: {
    topAddon: number;
    bottomAddon: number;
  },
): PathDescriptor {
  const { left: l, right: r } = path;
  const [bottomLeftX] = path.bottomLeft || [];
  const [bottomRightX] = path.bottomRight || [];

  const newBottomLeftX = bottomLeftX - bottomAddon;
  const newBottomRightX = bottomRightX + bottomAddon;

  return {
    ...path,
    left: [l[0], l[1], l[2] - topAddon, l[3]],
    right: [r[0], r[1], r[2] + topAddon, r[3]],
    bottomLeft: [newBottomLeftX, IH],
    bottomRight: [newBottomRightX, IH],
  };
}
