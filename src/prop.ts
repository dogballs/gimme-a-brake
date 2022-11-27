import { IH, HH, RS, POLE_START } from './config';
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
import { SoundController } from './sound';
import { generateStripes, stripesToY, stripesUnscaledHeight } from './stripes';
import {
  randomElement,
  randomElementDistributed,
  randomNumber,
} from './random';
import { Path, getCenterCurve } from './path';
import { Zone, ZoneKind } from './zone';
import { Context2D } from './types';

type PropKind =
  | 'green-bike'
  | 'green-roadwork'
  | 'green-sheep'
  | 'green-car'
  | 'green-turtle'
  | 'desert-tumbleweed'
  | 'desert-bike'
  | 'beach-barrel'
  | 'beach-barrel-stand'
  | 'beach-dolphin'
  | 'beach-dolphin-head';

export type Prop = {
  kind: PropKind;
  start: number;
  moveOffset: number;
  moveSpeed: number;
  initialPosition: number;
  position: number;
  positionSpeed: number;
};

export type PropBox = CollisionBox & {
  prop: Prop;
  curve: Curve;
  opacity: number;
};

const DOLPHIN_IN_OFFSET = 5;

export function getPropBoxes({
  soundController,
  props,
  images,
  path,
  section,
  nextSection,
  moveOffset,
  steerOffset,
  yOverride,
}: {
  soundController: SoundController;
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

      let inOffset = moveOffset - prop.start + roadDepth + propMoveOffset;
      if (isPreshow) {
        inOffset = 1;
      }

      if (prop.moveSpeed > 0) {
        prop.moveOffset = propMoveOffset - prop.moveSpeed;
      }

      if (['beach-dolphin'].includes(prop.kind)) {
        if (prop.positionSpeed !== 0 && inOffset >= DOLPHIN_IN_OFFSET) {
          let minPosition = 0;
          let maxPosition = 1;
          prop.position += prop.positionSpeed;
          if (prop.position < minPosition) {
            prop.position = minPosition;
            prop.positionSpeed = 0;
          } else if (prop.position > maxPosition) {
            prop.position = maxPosition;
            prop.positionSpeed = 0;
          }
        }
      } else {
        if (prop.positionSpeed !== 0) {
          let minPosition = 0;
          let maxPosition = 1;
          if (['desert-bike'].includes(prop.kind)) {
            const drift = 0.2;
            minPosition = Math.max(0, prop.initialPosition - drift);
            maxPosition = Math.min(1, prop.initialPosition + drift);
          }
          prop.position += prop.positionSpeed;
          if (prop.position < minPosition) {
            prop.position = minPosition;
            prop.positionSpeed *= -1;
          } else if (prop.position > maxPosition) {
            prop.position = maxPosition;
            prop.positionSpeed *= -1;
          }
        }
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

      let imageWidth = image.width * imageScale;
      let imageHeight = image.height * imageScale;
      let imageX = propX - imageWidth / 2;
      let imageY = propY - imageHeight;

      if (prop.kind === 'beach-dolphin-head') {
        if (inOffset > DOLPHIN_IN_OFFSET) {
          continue;
        }
        soundController.playIfNotPlaying('dolphin1');
        if (prop.position === 0) {
          imageX = propX - 2.5 * imageWidth;
        } else {
          imageX = propX + 2.5 * imageWidth;
        }
      }
      if (prop.kind === 'beach-dolphin') {
        if (prop.position >= 1 || prop.position <= 0) {
          continue;
        }
        if (inOffset < DOLPHIN_IN_OFFSET) {
          continue;
        }

        const d =
          prop.position <= 0.5 ? prop.position * 2 : (1 - prop.position) * 2;

        imageX = propX - imageWidth * (1 - prop.position);
        if (prop.initialPosition === 1) {
          imageX = propX + imageWidth / 2 - imageWidth * (1 - prop.position);
        }

        imageY = imageY - 20 * RS * d;
      }

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

    let flipped = false;
    if (
      ['green-bike', 'desert-tumbleweed', 'beach-barrel'].includes(
        propBox.prop.kind,
      )
    ) {
      const shouldFlip = Math.round(lastTime / 0.2) % 2 === 1;
      if (shouldFlip) {
        ctx.translate(propBox.x + propBox.width / 2, 0);
        ctx.scale(-1, 1);
        flipped = true;
      }
    }
    if (['beach-dolphin-head', 'beach-dolphin'].includes(propBox.prop.kind)) {
      const shouldFlip = propBox.prop.initialPosition === 1;
      if (shouldFlip) {
        ctx.translate(propBox.x + propBox.width / 2, 0);
        ctx.scale(-1, 1);
        flipped = true;
      }
    }

    let jumped = false;
    if (['desert-bike'].includes(propBox.prop.kind)) {
      const shouldJump = Math.round(lastTime / 0.05) % 2 === 1;
      if (shouldJump) {
        ctx.translate(0, 1);
        jumped = true;
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
    if (jumped) {
      ctx.translate(0, -1);
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
    case 'desert-tumbleweed':
      return images.propDesertTumbleweed;
    case 'desert-bike':
      return images.propDesertBike;
    case 'beach-barrel':
      return images.propBeachBarrel;
    case 'beach-barrel-stand':
      return images.propBeachBarrelStand;
    case 'beach-dolphin':
      return images.propBeachDolphin;
    case 'beach-dolphin-head':
      return images.propBeachDolphinHead;
    default:
      throw new Error(`Unsupported decor kind: "${kind}"`);
  }
}

const KINDS_BY_ZONE = new Map<
  ZoneKind,
  {
    kinds: PropKind[];
    distributions: number[];
    moveSpeeds: number[];
    positionSpeeds: number[];
  }
>();
KINDS_BY_ZONE.set('green', {
  kinds: ['green-bike', 'green-roadwork', 'green-turtle'],
  distributions: [0.5, 0.7, 1],
  moveSpeeds: [1, 0, 0],
  positionSpeeds: [0, 0, 0],
});
KINDS_BY_ZONE.set('desert', {
  kinds: ['desert-bike', 'desert-tumbleweed', 'green-sheep'],
  distributions: [0.5, 0.75, 1],
  moveSpeeds: [2, 0, 0],
  positionSpeeds: [0.005, 0.005, 0],
});
KINDS_BY_ZONE.set('beach', {
  kinds: ['beach-barrel', 'beach-barrel-stand', 'beach-dolphin'],
  distributions: [0.3, 0.8, 1],
  moveSpeeds: [0, 0, 0],
  positionSpeeds: [-0.003, 0, 0.005],
});
KINDS_BY_ZONE.set('forest', {
  kinds: [],
  distributions: [],
  moveSpeeds: [],
  positionSpeeds: [],
});

export function generateProps({
  startOffset,
  size,
  count,
  zoneKind,
}: {
  startOffset: number;
  size: number;
  count: number;
  zoneKind: ZoneKind;
}) {
  const props: Prop[] = [];

  const { kinds, distributions, moveSpeeds, positionSpeeds } =
    KINDS_BY_ZONE.get(zoneKind);

  if (kinds.length === 0) {
    return props;
  }

  console.assert(
    kinds.length === distributions.length && kinds.length === moveSpeeds.length,
    'prop lengths dont match',
  );

  const areaSize = size / count;

  // Go reverse to have the farthest props in the array first, which means the
  // closest will be rendered last, which is better for zindex.
  for (let i = count - 1; i >= 0; i--) {
    const areaStart = i * areaSize;
    const inAreaOffset = randomNumber(0, areaSize);

    const start = startOffset + areaStart + inAreaOffset;
    const { item: kind, index: kindIndex } = randomElementDistributed<PropKind>(
      kinds,
      distributions,
    );
    const moveSpeed = moveSpeeds[kindIndex];

    let initialPosition = randomNumber(10, 90) / 100;
    let positionSpeed = positionSpeeds[kindIndex];
    if (kind === 'beach-dolphin') {
      initialPosition = randomElement([0, 1]);
      positionSpeed = initialPosition === 1 ? -positionSpeed : positionSpeed;
    }

    const prop: Prop = {
      start,
      kind,
      initialPosition,
      position: initialPosition,
      positionSpeed,
      moveSpeed,
      moveOffset: 0,
    };

    props.push(prop);

    if (['beach-barrel'].includes(kind)) {
      props.push({
        ...prop,
        position: 1 - prop.position,
        positionSpeed: -prop.positionSpeed,
      });
    }
    if (['beach-dolphin'].includes(kind)) {
      props.push({
        ...prop,
        kind: 'beach-dolphin-head',
        positionSpeed: 0,
      });
    }
  }

  return props;
}

export function generatePropsForZones({ zones }: { zones: Zone[] }): Prop[] {
  const props: Prop[] = [];

  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    const nextZone = zones[i + 1];

    const startOffset = zone.start + POLE_START;
    const size = nextZone ? nextZone.start - startOffset - POLE_START : 0;

    console.assert(size >= 0, 'zone size < 0');

    const zoneProps = generateProps({
      startOffset,
      size,
      count: zone.propCount,
      zoneKind: zone.kind,
    });

    props.push(...zoneProps);
  }

  return props;
}
