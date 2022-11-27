import { IH, HH, RS } from './config';
import { CollisionBox } from './collision';
import {
  Curve,
  translateCurve,
  translateCurveUniform,
  steerCurve,
  pointOnCurve,
  drawCurve,
  curveXByY,
  lerpCurve,
} from './curve';
import { ImageMap } from './images';
import { getCurbPath } from './road';
import { Section } from './section';
import { generateStripes, stripesToY, stripesUnscaledHeight } from './stripes';
import {
  randomElement,
  randomElementDistributed,
  randomNumber,
} from './random';
import { Path, getCenterCurve } from './path';
import { Zone } from './zone';
import { Context2D } from './types';

type PropKind =
  | 'green-bike'
  | 'green-roadwork'
  | 'green-sheep'
  | 'green-car'
  | 'green-turtle';

export type Prop = {
  kind: PropKind;
  start: number;
  position: number;
  moveOffset?: number;
  moveSpeed?: number;
};

export type PropBox = CollisionBox & {
  prop: Prop;
  curve: Curve;
  opacity: number;
};

export function getPropBoxes({
  props,
  images,
  path,
  section,
  nextSection,
  moveOffset,
  steerOffset,
  yOverride,
}: {
  props: Prop[];
  images: ImageMap;
  path: Path;
  section: Section;
  nextSection: Section | undefined;
  moveOffset: number;
  steerOffset: number;
  yOverride?: number;
}) {
  let roadHeight = IH - (yOverride ?? HH);

  const stripes = generateStripes({ roadHeight });
  const roadDepth = stripesUnscaledHeight(stripes);

  const propBoxes: PropBox[] = [];

  let preshowSize = 700;
  if (section.kind === 'uphill' || nextSection?.kind === 'uphill') {
    preshowSize = 400;
  } else if (section.kind === 'downhill' || nextSection?.kind === 'downhill') {
    preshowSize = 0;
  }

  for (const prop of props) {
    const propMoveOffset = prop.moveOffset ?? 0;

    const appearStart = prop.start - propMoveOffset - roadDepth;
    const appearEnd = prop.start - propMoveOffset;
    const preshowAppearStart = appearStart - preshowSize;

    if (moveOffset >= preshowAppearStart && moveOffset <= appearEnd) {
      const isPreshow = moveOffset < appearStart;

      const centerCurve = getCenterCurve(path);

      let curve = centerCurve;
      if (prop.position > 0.5) {
        curve = lerpCurve(centerCurve, path.right, (prop.position - 0.5) * 2);
      } else if (prop.position < 0.5) {
        curve = lerpCurve(path.left, centerCurve, prop.position * 2);
      }

      const steeredCurve = steerCurve(curve, { steerOffset });

      if (prop.moveSpeed != null) {
        prop.moveOffset = propMoveOffset - prop.moveSpeed;
      }

      let inOffset = moveOffset - prop.start + roadDepth + propMoveOffset;
      if (isPreshow) {
        inOffset = 1;
      }

      const stripesY = stripesToY(stripes, { inOffset });
      if (stripesY === undefined) {
        continue;
      }

      const propY = IH - stripesY;
      const propX = curveXByY(steeredCurve, propY);
      if (propX === undefined) {
        continue;
      }

      let inHalfHeightT = stripesY / HH;

      let imageScale = Math.max(0, 1 - (1 - 0.1 * RS) * inHalfHeightT);
      let imageOpacity = 1;

      if (roadHeight > HH && propY < HH) {
        const inOverHeightT = Math.max(0, 1 - (HH - propY) / (roadHeight - HH));
        imageScale = 0.1 * inOverHeightT;
      } else if (isPreshow) {
        imageScale *= 1 - (appearStart - moveOffset) / preshowSize;
        imageOpacity = 1 - (appearStart - moveOffset) / preshowSize;
      }

      const image = imageByKind(images, prop.kind);

      const imageWidth = image.width * imageScale;
      const imageHeight = image.height * imageScale;
      const imageX = propX - imageWidth / 2;
      const imageY = propY - imageHeight;

      propBoxes.push({
        prop,
        curve: steeredCurve,
        x: imageX,
        y: imageY,
        z: roadDepth - inOffset,
        width: imageWidth,
        height: imageHeight,
        depth: 20,
        opacity: imageOpacity,
      });
    }
  }

  return propBoxes;
}

export function drawProps(
  ctx: Context2D,
  {
    lastTime,
    propBoxes,
    images,
    moveOffset,
    steerOffset,
  }: {
    lastTime: number;
    propBoxes: PropBox[];
    images: ImageMap;
    moveOffset: number;
    steerOffset: number;
  },
) {
  for (const propBox of propBoxes) {
    const image = imageByKind(images, propBox.prop.kind);

    // drawCurve(ctx, propBox.curve, { moveOffset, steerOffset: 0 });

    let flipped = false;
    if (propBox.prop.kind === 'green-bike') {
      const shouldFlip = Math.round(lastTime / 0.2) % 2 === 1;
      if (shouldFlip) {
        ctx.translate(propBox.x + propBox.width / 2, 0);
        ctx.scale(-1, 1);
        flipped = true;
      }
    }

    ctx.globalAlpha = propBox.opacity;
    ctx.drawImage(
      image,
      flipped ? 0 : propBox.x,
      propBox.y,
      propBox.width,
      propBox.height,
    );
    ctx.globalAlpha = 1;

    if (flipped) {
      ctx.scale(-1, 1);
      ctx.translate(-(propBox.x + propBox.width / 2), 0);
    }
  }
}

function imageByKind(images: ImageMap, kind: PropKind) {
  switch (kind) {
    case 'green-bike':
      return images.propGreenBike;
    case 'green-roadwork':
      return images.propGreenRoadwork;
    case 'green-sheep':
      return images.propGreenSheep;
    case 'green-car':
      return images.propGreenCar;
    case 'green-turtle':
      return images.propGreenTurtle;
    default:
      throw new Error(`Unsupported decor kind: "${kind}"`);
  }
}

export function generateProps({
  startOffset,
  size,
  count,
}: {
  startOffset: number;
  size: number;
  count: number;
}) {
  const props: Prop[] = [];

  const areaSize = size / count;

  // Go reverse to have the farthest props in the array first, which means the
  // closest will be rendered last, which is better for zindex.
  for (let i = count - 1; i >= 0; i--) {
    const areaStart = i * areaSize;
    const inAreaOffset = randomNumber(0, areaSize);

    const start = startOffset + areaStart + inAreaOffset;
    const kind = randomElementDistributed<PropKind>(
      ['green-bike', 'green-roadwork', 'green-turtle'],
      [0.5, 0.7, 1],
    );
    const position = randomNumber(10, 90) / 100;

    let moveSpeed = undefined;
    if (kind === 'green-bike') {
      moveSpeed = 1;
    }
    if (kind === 'green-car') {
      moveSpeed = 2;
    }

    props.push({
      start,
      kind,
      position,
      moveSpeed,
    });
  }

  return props;
}

export function generatePropsForZones({ zones }: { zones: Zone[] }): Prop[] {
  const props: Prop[] = [];

  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    const nextZone = zones[i + 1];
    const zoneProps = generateProps({
      startOffset: zone.start,
      size: nextZone ? nextZone.start - zone.start : 0,
      count: zone.propCount,
      // kinds: KINDS_BY_ZONE.get(zone.kind),
    });

    props.push(...zoneProps);
  }

  return props;
}
