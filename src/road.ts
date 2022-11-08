import { IH } from './config';
import { PathDescriptor } from './types';

// Line equation:
// left: 5x + 18y = 2700
// right: 18 y - 5 x = 800

const DEFAULT_BOTTOM_LEFT_X = -180;
const DEFAULT_BOTTOM_RIGHT_X = 560;

export function drawRoadMask(
  ctx: CanvasRenderingContext2D,
  path: PathDescriptor,
  { steerOffset, color = 'red' }: { steerOffset: number; color?: string },
) {
  const { left, right, bottomLeft, bottomRight } = steerPath(path, {
    steerOffset,
  });

  ctx.fillStyle = 'black';

  ctx.beginPath();
  ctx.moveTo(...bottomLeft);
  ctx.quadraticCurveTo(...left);
  ctx.lineTo(right[2], right[3]);
  ctx.quadraticCurveTo(right[0], right[1], ...bottomRight);
  ctx.lineTo(...bottomLeft);
  ctx.fill();
}

export function drawRoadCurb(
  ctx: CanvasRenderingContext2D,
  path: PathDescriptor,
  {
    moveOffset,
    steerOffset,
    color = 'red',
  }: { moveOffset: number; steerOffset: number; color?: string },
) {
  ctx.strokeStyle = color;
  ctx.setLineDash([10]);
  ctx.lineDashOffset = moveOffset;

  const { left, right, bottomLeft, bottomRight } = steerPath(path, {
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

function steerPath(
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
