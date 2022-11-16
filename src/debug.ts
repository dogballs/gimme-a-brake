import { IW, IH, HW, HH } from './config';
import { Section } from './section';
import { Context2D } from './types';

export function drawDebug(
  ctx: Context2D,
  {
    section,
    bgOffset,
    steerOffset,
    moveOffset,
    moveSpeed,
    moveSpeedChange,
    moveGear,
  }: {
    section: Section;
    bgOffset: number;
    steerOffset: number;
    moveOffset: number;
    moveSpeed: number;
    moveSpeedChange: number;
    moveGear: number;
  },
) {
  ctx.setLineDash([]);
  ctx.strokeStyle = '#000';
  ctx.font = '8px serif';

  ctx.strokeText(`section kind: ${section.kind}`, 5, 10);
  ctx.strokeText(`bg: ${bgOffset.toFixed(5)}`, 5, 20);
  ctx.strokeText(`steer: ${steerOffset.toFixed(5)}`, 5, 30);
  ctx.strokeText(`move offset: ${moveOffset.toFixed(5)}`, 5, 40);
  ctx.strokeText(`move speed: ${moveSpeed.toFixed(5)}`, 5, 50);
  ctx.strokeText(`move speed change: ${moveSpeedChange.toFixed(5)}`, 5, 60);
  ctx.strokeText(`move gear: ${moveGear}`, 5, 70);
}

export function drawHorizon(
  ctx: Context2D,
  { yOverride }: { yOverride?: number } = {},
) {
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(0, yOverride ?? HH);
  ctx.lineTo(IW, yOverride ?? HH);
  ctx.stroke();
}

export function drawGrid(ctx: Context2D) {
  ctx.setLineDash([]);
  ctx.strokeStyle = '#cccccc77';

  ctx.moveTo(HW, 0);
  ctx.lineTo(HW, IH);
  ctx.stroke();
}
