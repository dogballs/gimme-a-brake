import { IH, HH } from './config';
import {
  translateCurve,
  steerCurve,
  pointOnCurve,
  drawCurve,
  curveXByY,
} from './curve';
import { ImageMap } from './images';
import { getCurbPath } from './road';
import { generateStripes, stripesToY, stripesUnscaledHeight } from './stripes';
import { Path } from './path';
import { Section } from './section';
import { Context2D } from './types';

export type Decor = {
  kind: 'bush';
  placement: 'left' | 'right';
  start: number;
};

// TODO: they disappear when the bottom of the image hits the bottom of the screen
//   -> better top of the image hits the bottom of the screen
// TODO: variation in X position
// TODO: variation in sizes
// TODO: z-index with the car?
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

      const inOffset = moveOffset - decor.start + travelDistance;
      const stripesY = stripesToY(stripes, { inOffset });
      if (stripesY === undefined) {
        continue;
      }

      const decorY = IH - stripesY;
      const decorX = curveXByY(steerCurve(decorCurve, { steerOffset }), decorY);
      if (decorX === undefined) {
        continue;
      }

      const hhDecorT = stripesY / HH;

      const image = images.bush;

      let imageScale = Math.max(0, 1 - 0.95 * hhDecorT);
      if (roadHeight > HH && decorY < HH) {
        imageScale = 0.05;
      }

      const imageWidth = image.width * imageScale;
      const imageHeight = image.height * imageScale;
      const imageX = decor.placement === 'right' ? decorX : decorX - imageWidth;
      const imageY = decorY - imageHeight;

      ctx.drawImage(images.bush, imageX, imageY, imageWidth, imageHeight);
    }
  }
}
