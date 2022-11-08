import { PathDescriptor } from './types';

export function drawRoadMask(
  ctx: CanvasRenderingContext2D,
  { left, right, bottomLeft, bottomRight }: PathDescriptor,
  { steerOffset, color = 'red' }: { steerOffset: number; color?: string },
) {
  const adjustedSteerOffset = steerOffset * 1;

  const bottomLeftX = (bottomLeft?.[0] ?? -180) + adjustedSteerOffset;
  const bottomRightX = (bottomRight?.[0] ?? 560) + adjustedSteerOffset;

  ctx.fillStyle = 'black';

  ctx.beginPath();
  ctx.moveTo(bottomLeftX, 200);
  ctx.quadraticCurveTo(...left);
  ctx.lineTo(right[2], right[3]);
  ctx.quadraticCurveTo(right[0], right[1], bottomRightX, 200);
  ctx.lineTo(bottomLeftX, 200);
  ctx.fill();
}

export function drawRoadCurb(
  ctx: CanvasRenderingContext2D,
  { left, right, bottomLeft, bottomRight }: PathDescriptor,
  {
    moveOffset,
    steerOffset,
    color = 'red',
  }: { moveOffset: number; steerOffset: number; color?: string },
) {
  ctx.strokeStyle = color;
  ctx.setLineDash([10]);
  ctx.lineDashOffset = moveOffset;

  // ctx.lineWidth = 2;
  // ctx.strokeStyle = patterns.left;

  // (0, 150) (180, 100)
  // 5x + 18y = 2700
  // 5x = 2700 - 18y
  // x = (2700 - 18y) / 5
  // x = (2700 - 18 * 200) / 5

  const adjustedSteerOffset = steerOffset * 1;

  const bottomLeftX = bottomLeft?.[0] ?? -180;
  const bottomRightX = bottomRight?.[0] ?? 560;

  ctx.beginPath();
  ctx.moveTo(bottomLeftX + steerOffset, 200);
  ctx.quadraticCurveTo(...left);
  ctx.stroke();

  // 18 y - 5 x = 800
  // -5x = 800 - 18y
  // 5x = 18y - 800
  // x = (18y - 800) / 5
  // x = (18 * 200 - 800) / 5

  ctx.beginPath();
  ctx.moveTo(bottomRightX + steerOffset, 200);
  ctx.quadraticCurveTo(...right);
  ctx.stroke();
}
