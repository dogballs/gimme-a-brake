import { Decor, generateDecors, generateDecorsForZones } from './decor';
import { Prop, generateProps } from './prop';
import { Section } from './section';
import { Zone } from './zone';

type Map = {
  sections: Section[];
  zones: Zone[];
  decors: Decor[];
  props: Prop[];
};

const zones: Zone[] = [
  {
    start: 0,
    kind: 'green',
  },
  {
    start: 2000,
    kind: 'desert',
  },
];
const decors = generateDecorsForZones({ zones, amountPerZone: 30 });

export const straightMap: Map = {
  zones,
  decors,
  sections: [],
  props: [
    {
      kind: 'tree',
      start: 500,
      position: 0.2,
      moveSpeed: 1,
    },
  ],
};

export const longUphillMap: Map = {
  zones,
  decors,
  sections: [
    {
      kind: 'uphill',
      start: 100,
      size: 15000,
      steepness: 30,
    },
  ],
  props: [
    // {
    //   kind: 'rock',
    //   start: 500,
    //   position: 0.1,
    // },
    ...generateProps({
      startOffset: 300,
      size: 15000,
      amount: 30,
    }),
  ],
};

export const longLeftTurnMap: Map = {
  zones,
  decors,
  sections: [
    {
      kind: 'turn-right',
      start: 0,
      size: Infinity,
    },
  ],
  props: [
    ...generateProps({
      startOffset: 300,
      size: 15000,
      amount: 30,
    }),
  ],
};

export const coolMap: Map = {
  zones,
  decors,
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

  props: [
    // ...generateProps({
    //   startOffset: 300,
    //   size: 15000,
    //   amount: 30,
    // }),
  ],
};
