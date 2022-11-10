export type Curve = {
  controlX: number;
  controlY: number;
  topX: number;
  topY: number;
  bottomX: number;
  bottomY: number;
};

export type Path = {
  left: Curve;
  right: Curve;
};

export type Fragment = Path & { end: number };

export type Section =
  | {
      kind: 'straight' | 'turn-right' | 'turn-left';
      start: number;
      size: number;
    }
  | {
      kind: 'downhill' | 'uphill';
      start: number;
      size: number;
      steepness: number;
    };

export type Context2D =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;
