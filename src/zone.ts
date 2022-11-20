export type ZoneKind = 'green' | 'desert' | 'forest' | 'beach';

export type Zone = {
  start: number;
  kind: ZoneKind;
  decorAmount?: number;
  decorDriftMax?: number;
};

const defaultZone: Zone = {
  start: 0,
  kind: 'green',
};

export function getActiveZone({
  zones,
  moveOffset,
}: {
  zones: Zone[];
  moveOffset: number;
}): Zone | undefined {
  for (let i = zones.length - 1; i >= 0; i--) {
    const zone = zones[i];
    if (moveOffset >= zone.start) {
      return zone;
    }
  }
  return defaultZone;
}

export function getNextZone({
  zones,
  moveOffset,
}: {
  zones: Zone[];
  moveOffset: number;
}): Zone | undefined {
  let activeIndex = -1;
  for (let i = zones.length - 1; i >= 0; i--) {
    const zone = zones[i];
    if (moveOffset >= zone.start) {
      activeIndex = i;
      break;
    }
  }
  if (activeIndex !== -1) {
    const nextIndex = activeIndex + 1;
    return zones[nextIndex] ?? defaultZone;
  }
  return defaultZone;
}
