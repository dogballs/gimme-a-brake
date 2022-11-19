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
import { Context2D } from './types';

type DecorKind = 'bush' | 'tree' | 'rock';
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

  for (const decor of decors) {
    // Offset appearance so that decor positioned at 0 in the map is actually
    // rendered visually at 0 right from the start.
    const appearStart = decor.start - travelDistance;
    const appearEnd = decor.start;

    if (moveOffset >= appearStart && moveOffset <= appearEnd) {
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

      const hhDecorT = stripesY / HH;

      const image = imageByKind(images, decor.kind);

      let imageScale = Math.max(0, 1 - (1 - 0.1 * RENDER_SCALE) * hhDecorT);
      if (roadHeight > HH && decorY < HH) {
        imageScale = 0.05;
      }

      const imageWidth = image.width * imageScale;
      const imageHeight = image.height * imageScale;
      const imageX = decor.placement === 'right' ? decorX : decorX - imageWidth;
      const imageY = decorY - imageHeight;

      ctx.drawImage(image, imageX, imageY, imageWidth, imageHeight);
    }
  }
}

function imageByKind(images: ImageMap, kind: DecorKind) {
  switch (kind) {
    case 'bush':
      return images.bush;
    case 'tree':
      return images.tree;
    case 'rock':
      return images.rock;
    default:
      throw new Error(`Unsupported decor kind: "${kind}"`);
  }
}

export function generateDecors({
  startOffset,
  size,
  amount,
}: {
  startOffset: number;
  size: number;
  amount: number;
}) {
  const decors: Decor[] = [];

  const areaSize = size / amount;

  // Go reverse to have the farthest decors in the array first, which means the
  // closest will be rendered last, which is better for zindex.
  for (let i = amount - 1; i >= 0; i--) {
    const areaStart = i * areaSize;
    const inAreaOffset = randomNumber(0, areaSize);

    const start = startOffset + areaStart + inAreaOffset;
    const kind = randomElement<DecorKind>(['bush', 'tree', 'rock']);
    const driftOffset = randomNumber(0, 50);
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
