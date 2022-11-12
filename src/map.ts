import { Decor } from './decor';
import { Section } from './section';

type Map = {
  sections: Section[];
  decors: Decor[];
};

export const straightMap: Map = {
  sections: [],
  decors: [
    ...generateBushes({
      startOffset: 100,
      inBetweenOffset: 100,
      size: 5000,
    }),
  ],
};

export const longLeftTurnMap: Map = {
  sections: [
    {
      kind: 'turn-left',
      start: 0,
      size: Infinity,
    },
  ],
  decors: [],
};

export const coolMap: Map = {
  sections: [
    {
      kind: 'uphill',
      start: 100,
      size: 700,
      steepness: 30,
    },
    {
      kind: 'turn-left',
      start: 1000,
      size: 600,
    },
    {
      kind: 'turn-right',
      start: 1500,
      size: 1000,
    },
    {
      kind: 'downhill',
      start: 2600,
      size: 1000,
      steepness: 50,
    },
  ],
  decors: [
    ...generateBushes({
      startOffset: 100,
      inBetweenOffset: 100,
      size: 5000,
    }),
  ],
};

function generateBushes({
  startOffset,
  inBetweenOffset,
  size,
}: {
  startOffset: number;
  inBetweenOffset: number;
  size: number;
}) {
  const decors: Decor[] = [];

  for (
    let start = startOffset;
    start <= startOffset + size;
    start += inBetweenOffset
  ) {
    decors.push({
      kind: 'bush',
      start,
      placement: 'left',
    });
    decors.push({
      kind: 'bush',
      start,
      placement: 'right',
    });
  }

  return decors;
}
