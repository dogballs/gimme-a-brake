import { Decor, generateDecors } from './decor';
import { Prop, generateProps } from './prop';
import { Section } from './section';

type Map = {
  sections: Section[];
  decors: Decor[];
  props: Prop[];
};

export const straightMap: Map = {
  sections: [],
  decors: [
    ...generateDecors({
      startOffset: 100,
      amount: 1,
      size: 5000,
    }),
  ],
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
  sections: [
    {
      kind: 'uphill',
      start: 100,
      size: 15000,
      steepness: 30,
    },
  ],
  decors: [],
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
  sections: [
    {
      kind: 'turn-right',
      start: 0,
      size: Infinity,
    },
  ],
  decors: [],
  props: [
    ...generateProps({
      startOffset: 300,
      size: 15000,
      amount: 30,
    }),
  ],
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
    ...generateDecors({
      startOffset: 300,
      size: 15000,
      amount: 100,
    }),
  ],
  props: [
    ...generateProps({
      startOffset: 300,
      size: 15000,
      amount: 30,
    }),
  ],
};
