import { IH, HH, RS } from './config';
import { CollisionBox } from './collision';
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
import { Section } from './section';
import { generateStripes, stripesToY, stripesUnscaledHeight } from './stripes';
import { randomElement, randomNumber } from './random';
import { Path } from './path';
import { Context2D } from './types';

type PropKind = 'bush' | 'tree' | 'rock';
type PropPlacement = 'left' | 'right';

export type Prop = {
  kind: PropKind;
  start: number;
  placement: PropPlacement;
  driftOffset?: number;
};

export type PropBox = CollisionBox & {
  prop: Prop;
};

export function getPropBoxes({
  props,
  images,
  path,
  section,
  moveOffset,
  steerOffset,
  yOverride,
}: {
  props: Prop[];
  images: ImageMap;
  path: Path;
  section: Section;
  moveOffset: number;
  steerOffset: number;
  yOverride?: number;
}) {
  let roadHeight = IH - (yOverride ?? HH);

  const stripes = generateStripes({ roadHeight });
  const roadDepth = stripesUnscaledHeight(stripes);

  const propBoxes: PropBox[] = [];

  for (const prop of props) {
    const appearStart = prop.start - roadDepth;
    const appearEnd = prop.start;

    if (moveOffset >= appearStart && moveOffset <= appearEnd) {
      const sourceCurve = prop.placement === 'right' ? path.right : path.left;
      const placementSign = prop.placement === 'left' ? 1 : -1;

      const propCurve = translateCurve(sourceCurve, {
        top: 5 * placementSign,
        control: 5 * placementSign,
        bottom: 30 * placementSign + (prop.driftOffset ?? 0) * placementSign,
      });

      // const driftedCurve = translateCurveUniform(
      //   propCurve,
      //   (prop.driftOffset ?? 0) * placementSign,
      // );

      const inOffset = moveOffset - prop.start + roadDepth;
      const stripesY = stripesToY(stripes, { inOffset });
      if (stripesY === undefined) {
        continue;
      }

      const propY = IH - stripesY;
      const propX = curveXByY(steerCurve(propCurve, { steerOffset }), propY);
      if (propX === undefined) {
        continue;
      }

      const hhPropT = stripesY / HH;

      let imageScale = Math.max(0, 1 - (1 - 0.1 * RS) * hhPropT);
      if (roadHeight > HH && propY < HH) {
        imageScale = 0.05;
      }

      const image = imageByKind(images, prop.kind);

      const imageWidth = image.width * imageScale;
      const imageHeight = image.height * imageScale;
      const imageX = propX - imageWidth / 2;
      const imageY = propY - imageHeight;

      propBoxes.push({
        prop,
        x: imageX,
        y: imageY,
        z: roadDepth - inOffset,
        width: imageWidth,
        height: imageHeight,
        depth: 20,
      });
    }
  }

  return propBoxes;
}

export function drawProps(
  ctx: Context2D,
  { propBoxes, images }: { propBoxes: PropBox[]; images: ImageMap },
) {
  for (const propBox of propBoxes) {
    const image = imageByKind(images, propBox.prop.kind);

    ctx.drawImage(image, propBox.x, propBox.y, propBox.width, propBox.height);
  }
}

function imageByKind(images: ImageMap, kind: PropKind) {
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

export function generateProps({
  startOffset,
  size,
  amount,
}: {
  startOffset: number;
  size: number;
  amount: number;
}) {
  const props: Prop[] = [];

  const areaSize = size / amount;

  // Go reverse to have the farthest props in the array first, which means the
  // closest will be rendered last, which is better for zindex.
  for (let i = amount - 1; i >= 0; i--) {
    const areaStart = i * areaSize;
    const inAreaOffset = randomNumber(0, areaSize);

    const start = startOffset + areaStart + inAreaOffset;
    const kind = randomElement<PropKind>(['bush', 'tree', 'rock']);
    const driftOffset = randomNumber(0, 200);
    const placement = randomElement<PropPlacement>(['left', 'right']);

    props.push({
      start,
      kind,
      placement,
      driftOffset,
    });
  }

  return props;
}
