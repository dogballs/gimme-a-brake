import { RS } from './config';
import { ImageMap } from './images';

export type ZoneKind = 'green' | 'desert' | 'forest' | 'beach';

export type Zone = {
  start: number;
  kind: ZoneKind;
  propCount: number;
  skipPole?: boolean;
  decorCount?: number;
  decorDriftMax?: number;
  isEnding?: boolean;
};

const defaultZone: Zone = {
  start: 0,
  propCount: 0,
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

export function drawZonesRoute(
  ctx,
  {
    images,
    zones,
    moveOffset,
  }: { images: ImageMap; zones: Zone[]; moveOffset: number },
) {
  const x = 140 * RS;
  const width = 100 * RS;
  const height = 1 * RS;

  const dashWidth = 1 * RS;
  const dashHeight = 2 * RS;
  const dashY = 9 * RS;

  const totalLength = zones[zones.length - 2].start;
  const progress = moveOffset / totalLength;

  const points = [0];

  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#444';
  ctx.fillRect(x, 10 * RS, width, height);

  zones.forEach((zone, index) => {
    if (index === 1 || index >= zones.length - 2) {
      return;
    }
    const t = zone.start / totalLength;
    ctx.fillRect(x + width * t, dashY, dashWidth, dashHeight);
  });
  ctx.fillRect(x + width, dashY, dashWidth, dashHeight);

  ctx.drawImage(images.menuBullet, x + width * progress - 4, 5 * RS, 8, 8);

  ctx.globalAlpha = 1;
}
