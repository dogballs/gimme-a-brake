export type CoordDescriptor = [number, number];
export type LineDescriptor = [number, number, number, number];

export type PathDescriptor = {
  left: LineDescriptor;
  right: LineDescriptor;
  bottomLeft?: CoordDescriptor;
  bottomRight?: CoordDescriptor;
};

export type Fragment = PathDescriptor & { end: number };

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
