import { Section } from './types';

type Map = {
  sections: Section[];
};

export const straightMap: Map = {
  sections: [],
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
      size: 700,
      steepness: 50,
    },
  ],
};
