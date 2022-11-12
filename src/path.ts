import { Curve, steerCurve, translateCurve, lerpCurve } from './curve';

export type Path = {
  left: Curve;
  right: Curve;
};

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
