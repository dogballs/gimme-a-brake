import { Decor, generateDecors, generateDecorsForZones } from './decor';
import { Pole, generatePolesForZones } from './pole';
import { Prop, generateProps } from './prop';
import { Section } from './section';
import { Zone } from './zone';

type Map = {
  sections: Section[];
  zones: Zone[];
  decors: Decor[];
  props: Prop[];
  poles: Pole[];
};

const zones: Zone[] = [
  {
    start: 0,
    kind: 'green',
    decorAmount: 0,
    skipPole: true,
  },
  {
    start: 8000,
    kind: 'green',
    decorAmount: 60,
    skipPole: true,
  },
  {
    start: 20000,
    kind: 'desert',
    decorAmount: 60,
    skipPole: true,
  },
  {
    start: 35000,
    kind: 'beach',
    decorAmount: 10,
    skipPole: true,
  },
  {
    start: 50000,
    kind: 'forest',
    decorAmount: 1000,
  },
  {
    start: 70000,
    kind: 'forest',
    decorAmount: 0,
  },
];

const decors = generateDecorsForZones({ zones });
const poles = generatePolesForZones({ zones });

export const straightMap: Map = {
  zones,
  decors,
  poles,
  sections: [],
  props: [],
};

export const longUphillMap: Map = {
  zones,
  decors,
  poles,
  sections: [
    {
      kind: 'uphill',
      start: 2000,
      size: 15000,
      steepness: 30,
    },
  ],
  props: [],
};

export const longLeftTurnMap: Map = {
  zones,
  decors,
  poles,
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
  poles,
  sections: [
    {
      kind: 'uphill',
      start: 1500,
      size: 1200,
      steepness: 30,
    },
    {
      kind: 'turn-left',
      start: 4000,
      size: 1000,
    },
    {
      kind: 'turn-right',
      start: 6000,
      size: 1500,
    },
    {
      kind: 'downhill',
      start: 8000,
      size: 1500,
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
