import { IW, IH, HW, HH, VERSION, RS, FONT_PRIMARY } from './config';
import { Section } from './section';
import { Context2D } from './types';

export function drawDebug(
  ctx: Context2D,
  {
    section,
    // bgOffset,
    // steerOffset,
    moveOffset,
  }: // moveSpeed,
  // moveSpeedChange,
  // moveGear,
  // upgrades,
  {
    section: Section;
    // bgOffset: number;
    // steerOffset: number;
    moveOffset: number;
    // moveSpeed: number;
    // moveSpeedChange: number;
    // moveGear: number;
    // upgrades: Upgrade[];
  },
) {
  ctx.setLineDash([]);
  ctx.strokeStyle = '#000';
  ctx.font = '8px serif';
  ctx.lineWidth = 1;

  ctx.strokeText(`section kind: ${section.kind}`, 5, 10);
  // ctx.strokeText(`bg: ${bgOffset.toFixed(5)}`, 5, 20);
  // ctx.strokeText(`steer: ${steerOffset.toFixed(5)}`, 5, 30);
  ctx.strokeText(`move offset: ${moveOffset.toFixed(5)}`, 5, 40);
  // ctx.strokeText(`move speed: ${moveSpeed.toFixed(5)}`, 5, 50);
  // ctx.strokeText(`move speed change: ${moveSpeedChange.toFixed(5)}`, 5, 60);
  // ctx.strokeText(`move gear: ${moveGear}`, 5, 70);
  // ctx.strokeText(
  //   'upgrades: [' + upgrades.map((u) => u.kind).join() + ']',
  //   5,
  //   80,
  // );
}

export function drawVersion(ctx) {
  ctx.globalAlpha = 0.5;
  ctx.font = `${6 * RS}px ${FONT_PRIMARY}`;
  ctx.fillStyle = '#ddd';
  ctx.fillText(VERSION, 4 * RS, 196 * RS);
  ctx.globalAlpha = 1;
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

export function logClientCoordsOnClick(canvas: HTMLCanvasElement) {
  canvas.addEventListener('click', (ev) => {
    console.log(ev.clientX / 2, ev.clientY / 2);
  });
}
