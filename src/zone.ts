export type ZoneKind = 'green' | 'desert' | 'final';
export type Zone = {
  start: number;
  kind: ZoneKind;
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
    }
  }
  if (activeIndex !== -1) {
    const nextIndex = activeIndex + 1;
    return zones[nextIndex];
  }
  return getActiveZone({ zones, moveOffset });
}
