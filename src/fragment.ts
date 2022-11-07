import { HW, HH } from './config';
import { Fragment } from './types';

export const straightFragment: Fragment = {
  left: [HW - 10, HH, HW - 10, HH],
  right: [HW + 10, HH, HW + 10, HH],
  end: 0,
};

export function createDownhill({
  size,
  steepness,
  inOffset,
}: {
  size: number;
  steepness: number;
  inOffset: number;
}): Fragment[] {
  const halfSize = size / 2;
  const d = 1 - Math.abs((inOffset - halfSize) / halfSize);
  const yOffset = -steepness * d;
  const y = HH + yOffset;
  const minY = HH - steepness;

  return [
    {
      left: [HW, HH, HW - 10, y],
      right: [HW, HH, HW + 10, y],
      end: 100,
    },
    {
      left: [HW - 25, HH + 25, HW - 10, minY],
      right: [HW + 25, HH + 25, HW + 10, minY],
      end: 200,
    },
    {
      left: [HW - 25, HH + 15, HW - 10, minY],
      right: [HW + 25, HH + 15, HW + 10, minY],
      end: size - 200,
    },
    {
      left: [HW - 30, HH + 25, HW - 10, y],
      right: [HW + 30, HH + 25, HW + 10, y],
      end: size - 100,
    },
    {
      ...straightFragment,
      end: size,
    },
  ];
}

export function createUphill({
  size,
  steepness,
  inOffset,
  steerOffset,
}: {
  size: number;
  steepness: number;
  inOffset: number;
  steerOffset: number;
}): Fragment[] {
  const halfSize = size / 2;
  const d = 1 - Math.abs((inOffset - halfSize) / halfSize);
  const yOffset = steepness * d;
  const y = HH + yOffset;
  const maxY = HH + steepness;

  const xCorrection = steerOffset * 0.15;
  const bottomLeftCorrection = steerOffset * 0.1;
  const cxCorrection = steerOffset * 0.2;

  return [
    {
      left: [HW - 70, y - 5, HW - 60 + xCorrection, y],
      right: [HW + 70, y - 5, HW + 60 + xCorrection, y],
      bottomLeft: [-180 - bottomLeftCorrection, 0],
      bottomRight: [560 - bottomLeftCorrection, 0],
      end: 200,
    },
    {
      left: [HW - 120 + cxCorrection, HH + 30, HW - 90 + xCorrection, maxY],
      right: [HW + 120 + cxCorrection, HH + 30, HW + 90 + xCorrection, maxY],
      bottomLeft: [-180 - bottomLeftCorrection, 0],
      bottomRight: [560 - bottomLeftCorrection, 0],
      end: 300,
    },
    {
      left: [HW - 120 + cxCorrection, HH + 30, HW - 90 + xCorrection, maxY],
      right: [HW + 120 + cxCorrection, HH + 30, HW + 90 + xCorrection, maxY],
      bottomLeft: [-180 - bottomLeftCorrection, 0],
      bottomRight: [560 - bottomLeftCorrection, 0],
      end: size - 200,
    },
    {
      ...straightFragment,
      end: size,
    },
  ];
}

export function createTurn({
  size,
  direction,
}: {
  size: number;
  direction: 'right' | 'left';
}): Fragment[] {
  console.assert(size >= 600, 'turn too quick: %d', size);
  const fragments: Fragment[] = [
    // {
    //   left: [HW - 10, HH - 5, HW - 10, HH],
    //   right: [HW + 190, HH + 50, HW + 10, HH],
    //   end: 100,
    // },
    {
      left: [HW - 20, HH - 5, HW + 20, HH],
      right: [HW + 10, HH, HW + 20, HH],
      end: 100,
    },
    {
      left: [HW - 50, HH - 5, HW + 115, HH],
      right: [HW - 15, HH, HW + 115, HH],
      end: 200,
    },
    {
      left: [HW - 30, HH - 5, HW + 80, HH],
      right: [HW - 15, HH + 5, HW + 115, HH],
      end: size - 200,
    },
    {
      left: [HW - 30, HH - 5, HW + 60, HH],
      right: [HW + 0, HH + 20, HW + 80, HH],
      end: size - 100,
    },
    {
      ...straightFragment,
      end: size,
    },
  ];

  if (direction === 'left') {
    return mirrorFragments(fragments);
  }

  return fragments;
}

function mirrorFragments(fragments: Fragment[]): Fragment[] {
  return fragments.map((f) => {
    const l = f.left;
    const r = f.right;
    return {
      ...f,
      left: [HW + (HW - r[0]), r[1], HW + (HW - r[2]), r[3]],
      right: [HW + (HW - l[0]), l[1], HW + (HW - l[2]), l[3]],
    };
  });
}

export function steerFragments(
  fragments: Fragment[],
  steerOffset: number,
): Fragment[] {
  const topOffset = steerOffset * 0.01;

  return fragments.map((f) => {
    const l = f.left;
    const r = f.right;
    return {
      ...f,
      left: [l[0] + topOffset, l[1], l[2] + topOffset, l[3]],
      right: [r[0] + topOffset, r[1], r[2] + topOffset, r[3]],
    };
  });
}
