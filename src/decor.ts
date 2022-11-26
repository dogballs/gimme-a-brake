import { IH, HH, RENDER_SCALE } from './config';
import {
  translateCurve,
  translateCurveUniform,
  steerCurve,
  pointOnCurve,
  drawCurve,
  curveXByY,
} from './curve';
import { ImageMap } from './images';
import { getCurbPath } from './road';
import { generateStripes, stripesToY, stripesUnscaledHeight } from './stripes';
import { Path } from './path';
import { randomElement, randomNumber } from './random';
import { Section } from './section';
import { Zone, ZoneKind } from './zone';
import { Context2D } from './types';

type DecorKind =
  | 'green-bush'
  | 'green-tree'
  | 'green-rock'
  | 'desert-cactus'
  | 'desert-bush'
  | 'desert-sand'
  | 'forest-tree'
  | 'forest-spruce'
  | 'beach-buoy';
type DecorPlacement = 'left' | 'right';

export type Decor = {
  kind: DecorKind;
  placement: DecorPlacement;
  start: number;
  driftOffset?: number;
};

// TODO: they disappear when the bottom of the image hits the bottom of the screen
//   -> better top of the image hits the bottom of the screen
// TODO: variation in sizes
// TODO: z-index with the car?
// TODO: add preshow too?
export function drawDecors(
  ctx: Context2D,
  {
    decors,
    images,
    path,
    section,
    moveOffset,
    steerOffset,
    yOverride,
  }: {
    decors: Decor[];
    images: ImageMap;
    path: Path;
    section: Section;
    moveOffset: number;
    steerOffset: number;
    yOverride?: number;
  },
) {
  let roadHeight = IH - (yOverride ?? HH);

  // Not using yOverride because it will re-create the stripes when the road
  // is transitioning from straight to uphill/downhill.
  if (section.kind === 'uphill') {
    roadHeight = HH;
  } else if (section.kind === 'downhill') {
    roadHeight = HH + section.steepness;
  }

  const stripes = generateStripes({ roadHeight });
  const travelDistance = stripesUnscaledHeight(stripes);

  let preshowSize = 200;

  for (const decor of decors) {
    // Offset appearance so that decor positioned at 0 in the map is actually
    // rendered visually at 0 right from the start.
    const appearStart = decor.start - travelDistance;
    const appearEnd = decor.start;
    const preshowAppearStart = appearStart - preshowSize;

    if (moveOffset >= preshowAppearStart && moveOffset <= appearEnd) {
      const isPreshow = moveOffset < appearStart;

      const curbPath = getCurbPath(path, { steerOffset });

      const sourceCurve =
        decor.placement === 'right' ? curbPath.right : curbPath.left;
      const placementSign = decor.placement === 'right' ? 1 : -1;

      const decorCurve = translateCurve(sourceCurve, {
        top: 5 * placementSign,
        control: 10 * placementSign,
        bottom: 20 * placementSign,
      });

      const driftedCurve = translateCurveUniform(
        decorCurve,
        (decor.driftOffset ?? 0) * placementSign,
      );

      let inOffset = moveOffset - decor.start + travelDistance;
      if (isPreshow) {
        inOffset = 1;
      }

      const stripesY = stripesToY(stripes, { inOffset });
      if (stripesY === undefined) {
        continue;
      }

      const decorY = IH - stripesY;
      const decorX = curveXByY(
        steerCurve(driftedCurve, { steerOffset }),
        decorY,
      );
      if (decorX === undefined) {
        continue;
      }

      let inHalfHeightT = stripesY / HH;
      let imageScale = Math.max(
        0,
        1 - (1 - 0.1 * RENDER_SCALE) * inHalfHeightT,
      );
      let imageOpacity = 1;

      if (roadHeight > HH && decorY < HH) {
        const inOverHeightT = Math.max(
          0,
          1 - (HH - decorY) / (roadHeight - HH),
        );
        imageScale = 0.1 * inOverHeightT;
      } else if (isPreshow) {
        imageScale *= 1 - (appearStart - moveOffset) / preshowSize;
        imageOpacity = 1 - (appearStart - moveOffset) / preshowSize;
      }

      const image = imageByKind(images, decor.kind);

      const imageWidth = image.width * imageScale;
      const imageHeight = image.height * imageScale;
      const imageX = decor.placement === 'right' ? decorX : decorX - imageWidth;
      const imageY = decorY - imageHeight;

      ctx.globalAlpha = imageOpacity;
      ctx.drawImage(image, imageX, imageY, imageWidth, imageHeight);
      ctx.globalAlpha = 1;
    }
  }
}

function imageByKind(images: ImageMap, kind: DecorKind) {
  switch (kind) {
    case 'green-bush':
      return images.decorGreenBush;
    case 'green-tree':
      return images.decorGreenTree;
    case 'green-rock':
      return images.decorGreenRock;
    case 'desert-cactus':
      return images.decorDesertCactus;
    case 'desert-sand':
      return images.decorDesertSand;
    case 'desert-bush':
      return images.decorDesertBush;
    case 'forest-tree':
      return images.decorForestTree;
    case 'forest-spruce':
      return images.decorForestSpruce;
    case 'beach-buoy':
      return images.decorBeachBuoy;
    default:
      throw new Error(`Unsupported decor kind: "${kind}"`);
  }
}

export function generateDecors({
  startOffset,
  size,
  amount = 0,
  driftMax = 50,
  kinds = ['green-bush', 'green-rock', 'green-tree'],
}: {
  startOffset: number;
  size: number;
  amount?: number;
  driftMax?: number;
  kinds?: DecorKind[];
}) {
  const decors: Decor[] = [];

  if (size === 0 || amount === 0) {
    return decors;
  }

  const areaSize = size / amount;

  // Go reverse to have the farthest decors in the array first, which means the
  // closest will be rendered last, which is better for zindex.
  for (let i = amount - 1; i >= 0; i--) {
    const areaStart = i * areaSize;
    const inAreaOffset = randomNumber(0, areaSize);

    const start = startOffset + areaStart + inAreaOffset;
    const kind = randomElement<DecorKind>(kinds);
    const driftOffset = randomNumber(0, driftMax);
    const placement = randomElement<DecorPlacement>(['left', 'right']);

    decors.push({
      start,
      kind,
      placement,
      driftOffset,
    });
  }

  return decors;
}

const KINDS_BY_ZONE = new Map<ZoneKind, DecorKind[]>();
KINDS_BY_ZONE.set('green', ['green-bush', 'green-rock', 'green-tree']);
KINDS_BY_ZONE.set('desert', ['desert-cactus', 'desert-bush', 'desert-sand']);
KINDS_BY_ZONE.set('forest', ['forest-tree', 'forest-spruce']);
KINDS_BY_ZONE.set('beach', ['beach-buoy']);

export function generateDecorsForZones({ zones }: { zones: Zone[] }): Decor[] {
  const decors: Decor[] = [];

  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    const nextZone = zones[i + 1];
    const zoneDecors = generateDecors({
      startOffset: zone.start,
      size: nextZone ? nextZone.start - zone.start : 0,
      amount: zone.decorCount ?? 0,
      kinds: KINDS_BY_ZONE.get(zone.kind),
    });

    decors.push(...zoneDecors);
  }

  return decors;
}
