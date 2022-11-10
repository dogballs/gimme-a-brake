import { IH } from './config';
import { Curve } from './types';

const DEFAULT_BOTTOM_LEFT_X = -180;
const DEFAULT_BOTTOM_RIGHT_X = 560;

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
