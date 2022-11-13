import { HW, HH, RS } from './config';
import {
  Curve,
  leftRoadCurve,
  rightRoadCurve,
  DEFAULT_BOTTOM_LEFT_X,
  DEFAULT_BOTTOM_RIGHT_X,
} from './curve';
import { Path, lerpPath } from './path';

export type Fragment = Path & { end: number };

export const straightFragment: Fragment = {
  left: leftRoadCurve(HW - 10 * RS, HH, HW - 10 * RS, HH),
  right: rightRoadCurve(HW + 10 * RS, HH, HW + 10 * RS, HH),
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
      left: leftRoadCurve(HW, HH, HW - 10, y),
      right: rightRoadCurve(HW, HH, HW + 10, y),
      end: 100 * RS,
    },
    {
      left: leftRoadCurve(HW - 25, HH + 25, HW - 10, minY),
      right: rightRoadCurve(HW + 25, HH + 25, HW + 10, minY),
      end: 200 * RS,
    },
    {
      left: leftRoadCurve(HW - 25, HH + 15, HW - 10, minY),
      right: rightRoadCurve(HW + 25, HH + 15, HW + 10, minY),
      end: size - 200 * RS,
    },
    // {
    //   left: leftRoadCurve(HW - 30, HH + 25, HW - 10, y),
    //   right: rightRoadCurve(HW + 30, HH + 25, HW + 10, y),
    //   end: size - 100,
    // },
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
    // {
    //   left: leftRoadCurve(
    //     HW - 70,
    //     y - 5,
    //     HW - 60 + xCorrection,
    //     y,
    //     -180 - bottomLeftCorrection,
    //   ),
    //   right: rightRoadCurve(
    //     HW + 70,
    //     y - 5,
    //     HW + 60 + xCorrection,
    //     y,
    //     560 - bottomLeftCorrection,
    //   ),
    //   end: 300,
    // },
    {
      left: leftRoadCurve(
        HW - 120 * RS + cxCorrection,
        HH + 30 * RS,
        HW - 90 * RS + xCorrection,
        maxY,
        DEFAULT_BOTTOM_LEFT_X - bottomLeftCorrection,
      ),
      right: rightRoadCurve(
        HW + 120 * RS + cxCorrection,
        HH + 30 * RS,
        HW + 90 * RS + xCorrection,
        maxY,
        DEFAULT_BOTTOM_RIGHT_X - bottomLeftCorrection,
      ),
      end: 400 * RS,
    },
    {
      left: leftRoadCurve(
        HW - 120 * RS + cxCorrection,
        HH + 30 * RS,
        HW - 90 * RS + xCorrection,
        maxY,
        DEFAULT_BOTTOM_LEFT_X - bottomLeftCorrection,
      ),
      right: rightRoadCurve(
        HW + 120 * RS + cxCorrection,
        HH + 30 * RS,
        HW + 90 * RS + xCorrection,
        maxY,
        DEFAULT_BOTTOM_RIGHT_X - bottomLeftCorrection,
      ),
      end: size - 200 * RS,
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
  console.assert(size >= 600 * RS, 'turn too quick: %d', size);
  let fragments: Fragment[] = [
    // {
    //   left: [HW - 10, HH - 5, HW - 10, HH],
    //   right: [HW + 190, HH + 50, HW + 10, HH],
    //   end: 100,
    // },
    {
      left: leftRoadCurve(HW - 20 * RS, HH - 5 * RS, HW + 20 * RS, HH),
      right: rightRoadCurve(HW + 10 * RS, HH, HW + 20 * RS, HH),
      end: 100 * RS,
    },
    {
      left: leftRoadCurve(HW - 50 * RS, HH - 5 * RS, HW + 115 * RS, HH),
      right: rightRoadCurve(HW - 15 * RS, HH, HW + 115 * RS, HH),
      end: 200 * RS,
    },
    {
      left: leftRoadCurve(HW - 30 * RS, HH - 5 * RS, HW + 80 * RS, HH),
      right: rightRoadCurve(HW - 15 * RS, HH + 5 * RS, HW + 115 * RS, HH),
      end: size - 200 * RS,
    },
    {
      left: leftRoadCurve(HW - 30 * RS, HH - 5 * RS, HW + 60 * RS, HH),
      right: rightRoadCurve(HW + 0 * RS, HH + 20 * RS, HW + 80 * RS, HH),
      end: size - 100 * RS,
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
  return fragments.map((fragment) => {
    const { left, right } = fragment;
    return {
      ...fragment,
      left: {
        ...left,
        controlX: HW + (HW - right.controlX),
        controlY: right.controlY,
        topX: HW + (HW - right.topX),
        topY: right.topY,
      },
      right: {
        ...right,
        controlX: HW + (HW - left.controlX),
        controlY: left.controlY,
        topX: HW + (HW - left.topX),
        topY: left.topY,
      },
    };
  });
}

function steerFragments(
  fragments: Fragment[],
  steerOffset: number,
): Fragment[] {
  const topOffset = steerOffset * 0.01;

  return fragments.map((fragment) => {
    const { left, right } = fragment;
    return {
      ...fragment,
      left: {
        ...left,
        controlX: left.controlX + topOffset,
        topX: left.topX + topOffset,
      },
      right: {
        ...right,
        controlX: right.controlX + topOffset,
        topX: right.topX + topOffset,
      },
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
