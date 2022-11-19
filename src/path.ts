import { Curve, steerCurve, translateCurve, lerpCurve } from './curve';

export type Path = {
  left: Curve;
  right: Curve;
};

export function getCenterCurve(path: Path): Curve {
  return {
    topX: path.left.topX + (path.right.topX - path.left.topX) / 2,
    topY: path.left.topY,
    controlX:
      path.left.controlX + (path.right.controlX - path.left.controlX) / 2,
    controlY: path.left.controlY,
    bottomX: path.left.bottomX + (path.right.bottomX - path.left.bottomX) / 2,
    bottomY: path.left.bottomY,
  };
}

export function steerPath(
  path: Path,
  { steerOffset }: { steerOffset: number },
): Path {
  return {
    ...path,
    left: steerCurve(path.left, { steerOffset }),
    right: steerCurve(path.right, { steerOffset }),
  };
}

export function translatePath(
  path: Path,
  {
    top,
    bottom,
  }: {
    top: number;
    bottom: number;
  },
): Path {
  return {
    ...path,
    left: translateCurve(path.left, { top: -top, bottom: -bottom }),
    right: translateCurve(path.right, { top, bottom }),
  };
}

export function lerpPath(p1: Path, p2: Path, d: number): Path {
  return {
    left: lerpCurve(p1.left, p2.left, d),
    right: lerpCurve(p1.right, p2.right, d),
  };
}
