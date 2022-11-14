import { Decor, generateDecor } from './decor';
import { Section } from './section';

type Map = {
  sections: Section[];
  decors: Decor[];
};

export const straightMap: Map = {
  sections: [],
  decors: [
    ...generateDecor({
      startOffset: 100,
      amount: 1,
      size: 5000,
      // inBetweenOffset: 200,
    }),
  ],
};

export const longUphillMap: Map = {
  sections: [
    {
      kind: 'downhill',
      start: 100,
      size: 1000,
      steepness: 30,
    },
  ],
  decors: [
    // ...generateDecor({
    //   startOffset: 0,
    //   inBetweenOffset: 200,
    //   size: 2000,
    // }),
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
    ...generateDecor({
      startOffset: 300,
      size: 15000,
      amount: 100,
    }),
  ],
};
