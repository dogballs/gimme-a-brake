import { Decor, generateDecorsForZones } from './decor';
import { Pole, generatePolesForZones } from './pole';
import { Prop, generatePropsForZones } from './prop';
import { Section, generateSectionsForZones } from './section';
import { Zone } from './zone';

type Map = {
  sections: Section[];
  zones: Zone[];
  decors: Decor[];
  props: Prop[];
  poles: Pole[];
};

const PRE_ZONE_SIZE = 3000;
const ZONE_SIZE = 22000;
const ENDING_SIZE = 18000;
const PROP_COUNT_PER_ZONE = 30;

const zones: Zone[] = [
  {
    start: 0,
    kind: 'green',
    propCount: 0,
    decorCount: 20,
    skipPole: true,
  },
  {
    start: PRE_ZONE_SIZE,
    kind: 'green',
    propCount: PROP_COUNT_PER_ZONE,
    decorCount: 100,
    skipPole: true,
  },
  {
    start: PRE_ZONE_SIZE + ZONE_SIZE,
    kind: 'desert',
    propCount: PROP_COUNT_PER_ZONE,
    decorCount: 100,
  },
  {
    start: PRE_ZONE_SIZE + ZONE_SIZE * 2,
    kind: 'beach',
    propCount: PROP_COUNT_PER_ZONE,
    decorCount: 20,
  },
  {
    start: PRE_ZONE_SIZE + ZONE_SIZE * 3,
    kind: 'forest',
    propCount: PROP_COUNT_PER_ZONE,
    decorCount: 2000,
  },
  {
    start: PRE_ZONE_SIZE + ZONE_SIZE * 4,
    kind: 'forest',
    propCount: 0,
    decorCount: 1000,
    skipPole: true,
    isEnding: true,
  },
  {
    start: PRE_ZONE_SIZE + ZONE_SIZE * 4 + ENDING_SIZE,
    kind: 'forest',
    propCount: 0,
    decorCount: 20,
    skipPole: true,
    isEnding: true,
  },
];

// Test the ending
// const zones: Zone[] = [
//   {
//     start: 0,
//     kind: 'green',
//     propCount: 0,
//     decorCount: 20,
//     skipPole: true,
//   },
//   {
//     start: 2000,
//     kind: 'forest',
//     propCount: 0,
//     decorCount: 1000,
//     skipPole: true,
//     isEnding: true,
//   },
//   {
//     start: 18000,
//     kind: 'forest',
//     propCount: 0,
//     decorCount: 20,
//     skipPole: true,
//     isEnding: true,
//   },
// ];

// const decors = generateDecorsForZones({ zones });
// const poles = generatePolesForZones({ zones });
// const props = generatePropsForZones({ zones });

// export const straightMap: Map = {
//   zones,
//   decors,
//   poles,
//   props,
//   sections: [],
// };

// export const coolMap: Map = {
//   zones,
//   decors,
//   poles,
//   props,
//   sections: [
//     {
//       kind: 'uphill',
//       start: 1500,
//       size: 1200,
//       steepness: 30,
//     },
//     {
//       kind: 'turn-left',
//       start: 4000,
//       size: 1000,
//     },
//     {
//       kind: 'turn-right',
//       start: 6000,
//       size: 1500,
//     },
//     {
//       kind: 'downhill',
//       start: 8000,
//       size: 1500,
//       steepness: 50,
//     },
//   ],
// };

// export const longUphillMap: Map = {
//   zones,
//   decors,
//   poles,
//   sections: [
//     {
//       kind: 'uphill',
//       start: 2000,
//       size: 15000,
//       steepness: 30,
//     },
//   ],
//   props: [],
// };

// export const longLeftTurnMap: Map = {
//   zones,
//   decors,
//   poles,
//   props,
//   sections: [
//     {
//       kind: 'turn-right',
//       start: 0,
//       size: Infinity,
//     },
//   ],
// };

export function generateMap(): Map {
  const decors = generateDecorsForZones({ zones });
  const poles = generatePolesForZones({ zones });
  const props = generatePropsForZones({ zones });
  const sections = generateSectionsForZones({ zones });

  const map: Map = {
    zones,
    decors,
    poles,
    props,
    sections,
  };

  return map;
}
