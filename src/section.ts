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
