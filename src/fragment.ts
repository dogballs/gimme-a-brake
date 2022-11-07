import { HW, HH } from './config';
import { Fragment, LineDescriptor, PathDescriptor } from './types';

export const straightFragment: Fragment = {
  left: [HW - 10, HH, HW - 10, HH],
  right: [HW + 10, HH, HW + 10, HH],
  end: 0,
};

export function createDownhill({
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
  const yOffset = -steepness * d;
  const y = HH + yOffset;
  const minY = HH - steepness;

  let fragments: Fragment[] = [
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

  fragments = steerFragments(fragments, steerOffset);

  return fragments;
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

  let fragments: Fragment[] = [
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

  fragments = steerFragments(fragments, steerOffset);

  return fragments;
}

export function createTurn({
  size,
  direction,
  steerOffset,
}: {
  size: number;
  direction: 'right' | 'left';
  steerOffset: number;
}): Fragment[] {
  console.assert(size >= 600, 'turn too quick: %d', size);
  let fragments: Fragment[] = [
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
    fragments = mirrorFragments(fragments);
  }

  fragments = steerFragments(fragments, steerOffset);

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

function steerFragments(
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

export function lerpFragments({
  fragments,
  inOffset,
}: {
  fragments: Fragment[];
  inOffset: number;
}) {
  const activeIndex = fragments.findIndex((fragment) => {
    return inOffset < fragment.end;
  });
  const prevIndex = activeIndex !== -1 ? activeIndex - 1 : -1;

  const prevFragment = fragments[prevIndex] || straightFragment;
  const activeFragment = fragments[activeIndex] || straightFragment;

  let d = 0;

  const fragmentSize = activeFragment.end - prevFragment.end;
  const inFragmentOffset = inOffset - prevFragment.end;
  if (fragmentSize !== 0) {
    d = inFragmentOffset / fragmentSize;
  }

  const path = lerpPath(prevFragment, activeFragment, d);

  return path;
}

function lerpPath(
  p1: PathDescriptor,
  p2: PathDescriptor,
  d: number,
): PathDescriptor {
  return {
    left: lerpLine(p1.left, p2.left, d),
    right: lerpLine(p1.right, p2.right, d),
  };
}

function lerpLine(
  l1: LineDescriptor,
  l2: LineDescriptor,
  d: number,
): LineDescriptor {
  console.assert(d >= 0 && d <= 1, 'd must be normalized: %d', d);

  const cpx = l1[0] + (l2[0] - l1[0]) * d;
  const cpy = l1[1] + (l2[1] - l1[1]) * d;
  const x = l1[2] + (l2[2] - l1[2]) * d;
  const y = l1[3] + (l2[3] - l1[3]) * d;

  return [cpx, cpy, x, y];
}
