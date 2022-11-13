import { IH } from './config';
import { Context2D } from './types';

// Line equation:
// left: 5x + 18y = 2700
// right: 18 y - 5 x = 800
const DEFAULT_BOTTOM_LEFT_X = -180;
const DEFAULT_BOTTOM_RIGHT_X = 560;

export type Curve = {
  controlX: number;
  controlY: number;
  topX: number;
  topY: number;
  bottomX: number;
  bottomY: number;
};

export function leftRoadCurve(
  controlX: number,
  controlY: number,
  topX: number,
  topY: number,
  bottomX: number = DEFAULT_BOTTOM_LEFT_X,
  bottomY: number = IH,
): Curve {
  return { controlX, controlY, topX, topY, bottomX, bottomY };
}

export function rightRoadCurve(
  controlX: number,
  controlY: number,
  topX: number,
  topY: number,
  bottomX: number = DEFAULT_BOTTOM_RIGHT_X,
  bottomY: number = IH,
): Curve {
  return { controlX, controlY, topX, topY, bottomX, bottomY };
}

export function translateCurveUniform(c: Curve, offset: number) {
  return translateCurve(c, { control: offset, top: offset, bottom: offset });
}

export function translateCurve(
  c: Curve,
  {
    control = 0,
    top = 0,
    bottom = 0,
  }: {
    control?: number;
    top?: number;
    bottom?: number;
  },
): Curve {
  return {
    ...c,
    controlX: c.controlX + control,
    topX: c.topX + top,
    bottomX: c.bottomX + bottom,
  };
}

export function steerCurve(
  curve: Curve,
  { steerOffset }: { steerOffset: number },
): Curve {
  const adjustedSteerOffset = steerOffset * 1;
  return {
    ...curve,
    bottomX: curve.bottomX + adjustedSteerOffset,
  };
}

export function lerpCurve(c1: Curve, c2: Curve, t: number): Curve {
  console.assert(t >= 0 && t <= 1, 'd must be normalized: %d', t);

  const controlX = c1.controlX + (c2.controlX - c1.controlX) * t;
  const controlY = c1.controlY + (c2.controlY - c1.controlY) * t;
  const topX = c1.topX + (c2.topX - c1.topX) * t;
  const topY = c1.topY + (c2.topY - c1.topY) * t;
  const bottomX = c1.bottomX + (c2.bottomX - c1.bottomX) * t;
  const bottomY = c1.bottomY + (c2.bottomY - c1.bottomY) * t;

  return {
    controlX,
    controlY,
    topX,
    topY,
    bottomX,
    bottomY,
  };
}

// https://stackoverflow.com/a/5634528/1573638
export function pointOnCurve(
  curve: Curve,
  t: number,
): { x: number; y: number } {
  console.assert(t >= 0 && t <= 1, 't must be normalized: %d', t);

  const x =
    (1 - t) * (1 - t) * curve.bottomX +
    2 * (1 - t) * t * curve.controlX +
    t * t * curve.topX;
  const y =
    (1 - t) * (1 - t) * curve.bottomY +
    2 * (1 - t) * t * curve.controlY +
    t * t * curve.topY;

  return { x, y };
}

export function curveXByY(curve: Curve, y: number) {
  // TODO: optimize: binary search? lut?
  for (let t = 0; t <= 1; t += 0.01) {
    const p = pointOnCurve(curve, t);
    if (Math.abs(p.y - y) <= 1) {
      return p.x;
    }
  }
  return undefined;
}

export function drawCurve(
  ctx: Context2D,
  originalCurve: Curve,
  {
    moveOffset,
    steerOffset,
    color = 'orange',
    dashPattern,
  }: {
    moveOffset: number;
    steerOffset: number;
    color?: string;
    dashPattern?: number[];
  },
) {
  ctx.strokeStyle = color;
  if (dashPattern) {
    ctx.setLineDash(dashPattern);
  }
  ctx.lineDashOffset = moveOffset;

  const curve = steerCurve(originalCurve, {
    steerOffset,
  });

  ctx.beginPath();
  ctx.moveTo(curve.bottomX, curve.bottomY);
  ctx.quadraticCurveTo(curve.controlX, curve.controlY, curve.topX, curve.topY);
  ctx.stroke();
}
