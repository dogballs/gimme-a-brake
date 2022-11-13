import { IW, IH, RENDER_SCALE } from './config';
import { ImageMap } from './images';
import { Context2D } from './types';

export function drawCar(
  ctx,
  {
    images,
    steerOffset,
  }: {
    images: ImageMap;
    steerOffset: number;
  },
) {
  const image = images.car;
  const scale = 0.6 * RENDER_SCALE;

  const centerX = (IW - image.width * scale) / 2;
  const carSteerOffset = -1 * steerOffset * 0.02;

  const x = centerX + carSteerOffset;
  const y = IH - 70 * RENDER_SCALE;

  ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
}
