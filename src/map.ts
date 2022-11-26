import { Decor, generateDecors, generateDecorsForZones } from './decor';
import { Pole, generatePolesForZones } from './pole';
import { Prop, generatePropsForZones } from './prop';
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
    start: 10,
    kind: 'green',
    propCount: 10,
    decorCount: 50,
    skipPole: true,
  },
  {
    start: 5000,
    kind: 'green',
    propCount: 30,
    decorCount: 100,
    skipPole: true,
  },
  {
    start: 20000,
    kind: 'desert',
    propCount: 40,
    decorCount: 100,
    skipPole: true,
  },
  {
    start: 35000,
    kind: 'beach',
    propCount: 40,
    decorCount: 20,
    skipPole: true,
  },
  {
    start: 50000,
    kind: 'forest',
    propCount: 40,
    decorCount: 2000,
  },
  {
    start: 70000,
    kind: 'forest',
    propCount: 0,
    decorCount: 0,
  },
];

const decors = generateDecorsForZones({ zones });
const poles = generatePolesForZones({ zones });
const props = generatePropsForZones({ zones });

export const straightMap: Map = {
  zones,
  decors,
  poles,
  props,
  sections: [],
};

export const coolMap: Map = {
  zones,
  decors,
  poles,
  props,
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
  props,
  sections: [
    {
      kind: 'turn-right',
      start: 0,
      size: Infinity,
    },
  ],
};
