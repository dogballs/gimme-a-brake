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
// TODO: does not behave nice uphills/downhills
export function drawDecors(
  ctx: Context2D,
  {
    decors,
    images,
    path,
    moveOffset,
    steerOffset,
    yOverride,
  }: {
    decors: Decor[];
    images: ImageMap;
    path: Path;
    moveOffset: number;
    steerOffset: number;
    yOverride?: number;
  },
) {
  const roadHeight = IH - (yOverride ?? HH);
  const stripes = generateStripes({ roadHeight });
  const decorWindow = stripesUnscaledHeight(stripes);

  for (const decor of decors) {
    if (moveOffset >= decor.start && moveOffset <= decor.start + decorWindow) {
      const curbPath = getCurbPath(path, { steerOffset });

      const sourceCurve =
        decor.placement === 'right' ? curbPath.right : curbPath.left;
      const placementSign = decor.placement === 'right' ? 1 : -1;

      const decorCurve = translateCurve(sourceCurve, {
        top: 5 * placementSign,
        control: 10 * placementSign,
        bottom: 20 * placementSign,
      });

      const inOffset = moveOffset - decor.start;
      const stripesY = stripesToY(stripes, { inOffset });
      const decorT = stripesY / roadHeight;
      const decorY = IH - stripesY;

      const decorX = curveXByY(steerCurve(decorCurve, { steerOffset }), decorY);

      const image = images.bush;

      const imageScale = 1 - 0.95 * decorT;
      const imageWidth = image.width * imageScale;
      const imageHeight = image.height * imageScale;
      const imageX = decor.placement === 'right' ? decorX : decorX - imageWidth;
      const imageY = decorY - imageHeight;

      ctx.drawImage(images.bush, imageX, imageY, imageWidth, imageHeight);
    }
  }
}
