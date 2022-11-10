import { IH } from './config';
import { Context2D, Path } from './types';

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
  path: Path,
  { steerOffset, color = 'black' }: Omit<DrawRoadOpts, 'moveOffset'>,
) {
  const { left, right } = applySteerOffset(path, {
    steerOffset,
  });

  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(left.bottomX, left.bottomY);
  ctx.quadraticCurveTo(left.controlX, left.controlY, left.topX, left.topY);
  ctx.lineTo(right.topX, right.topY);
  ctx.quadraticCurveTo(
    right.controlX,
    right.controlY,
    right.bottomX,
    right.bottomY,
  );
  ctx.lineTo(left.bottomX, left.bottomY);

  // ctx.beginPath();
  // ctx.moveTo(...bottomLeft);
  // ctx.quadraticCurveTo(...left);
  // ctx.lineTo(right[2], right[3]);
  // ctx.quadraticCurveTo(right[0], right[1], ...bottomRight);
  // ctx.lineTo(...bottomLeft);
  ctx.fill();
}

export function drawCurbMask(
  ctx: Context2D,
  path: Path,
  { steerOffset, color = 'black' }: Omit<DrawRoadOpts, 'moveOffset'>,
) {
  const topWidth = 10;
  const bottomWidth = 40;

  const steeredPath = applySteerOffset(path, {
    steerOffset,
  });
  const { left, right } = applyCurbAddons(steeredPath, {
    // TODO: maybe make it wider for uphills
    topAddon: 1,
    bottomAddon: 50,
  });

  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(left.bottomX, left.bottomY);
  ctx.quadraticCurveTo(left.controlX, left.controlY, left.topX, left.topY);
  ctx.lineTo(right.topX, right.topY);
  ctx.quadraticCurveTo(
    right.controlX,
    right.controlY,
    right.bottomX,
    right.bottomY,
  );

  // ctx.beginPath();
  // ctx.moveTo(...bottomLeft);
  // ctx.quadraticCurveTo(...left);
  // ctx.lineTo(right[2], right[3]);
  // ctx.quadraticCurveTo(right[0], right[1], ...bottomRight);
  // ctx.lineTo(...bottomLeft);
  ctx.fill();
}

export function drawRoadLines(
  ctx: Context2D,
  path: Path,
  { moveOffset, steerOffset, color = 'red' }: DrawRoadOpts,
) {
  ctx.strokeStyle = color;
  ctx.setLineDash([10]);
  ctx.lineDashOffset = moveOffset;

  const { left, right } = applySteerOffset(path, {
    steerOffset,
  });

  ctx.beginPath();
  ctx.moveTo(left.bottomX, left.bottomY);
  ctx.quadraticCurveTo(left.controlX, left.controlY, left.topX, left.topY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(right.bottomX, right.bottomY);
  ctx.quadraticCurveTo(right.controlX, right.controlY, right.topX, right.topY);
  ctx.stroke();
}

function applySteerOffset(
  path: Path,
  { steerOffset }: { steerOffset: number },
): Path {
  const { left, right } = path;

  const adjustedSteerOffset = steerOffset * 1;

  return {
    ...path,
    left: {
      ...left,
      bottomX: left.bottomX + adjustedSteerOffset,
    },
    right: {
      ...right,
      bottomX: right.bottomX + adjustedSteerOffset,
    },
  };
}

function applyCurbAddons(
  path: Path,
  {
    topAddon,
    bottomAddon,
  }: {
    topAddon: number;
    bottomAddon: number;
  },
): Path {
  const { left, right } = path;

  return {
    ...path,
    left: {
      ...left,
      topX: left.topX - topAddon,
      bottomX: left.bottomX - bottomAddon,
    },
    right: {
      ...right,
      topX: right.topX + topAddon,
      bottomX: right.bottomX + bottomAddon,
    },
  };
}
