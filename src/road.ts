import { IH, RS } from './config';
import { Path, steerPath, translatePath } from './path';
import { Context2D } from './types';

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
  const { left, right } = steerPath(path, {
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
  ctx.fill();
}

export function getCurbPath(
  path: Path,
  { steerOffset }: { steerOffset: number },
) {
  return translatePath(path, {
    // TODO: maybe make it wider for uphills
    top: 1 * RS,
    bottom: 50 * RS,
  });
}

export function drawCurbMask(
  ctx: Context2D,
  path: Path,
  { steerOffset, color = 'black' }: Omit<DrawRoadOpts, 'moveOffset'>,
) {
  const steeredPath = steerPath(path, {
    steerOffset,
  });
  const { left, right } = getCurbPath(steeredPath, { steerOffset });

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

  const { left, right } = steerPath(path, {
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
