import { Keycodes, listenKeyboard } from './controls';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const BW = 380;
const BH = 200;

const IW = BW;
const IH = BH;
const HW = IW / 2; // half = 190
const HH = IH / 2; // half = 100

canvas.width = IW;
canvas.height = IH;

canvas.addEventListener('click', (ev) => {
  console.log(ev.clientX / 2, ev.clientY / 2);
});

const { getKeys } = listenKeyboard();

const STEER_LIMIT = Infinity;
const STEER_TURN_COUNTER_FORCE = 3;

const MOVE_SPEED = 3;
const STEER_SPEED = 5;

const state = {
  moveSpeed: 0,
  moveOffset: 0,
  steerSpeed: 0,
  steerOffset: 0,
};

const images = {
  car: undefined,
};

type CoordDescriptor = [number, number];
type LineDescriptor = [number, number, number, number];

type PathDescriptor = {
  left: LineDescriptor;
  right: LineDescriptor;
  bottomLeft?: CoordDescriptor;
  bottomRight?: CoordDescriptor;
};

type Fragment = PathDescriptor & { end: number };

const straightFragment: Fragment = {
  left: [HW - 10, HH, HW - 10, HH],
  right: [HW + 10, HH, HW + 10, HH],
  end: 0,
};

type Section =
  | {
      kind: 'straight' | 'turn-right' | 'turn-left';
      start: number;
      size: number;
    }
  | {
      kind: 'downhill' | 'uphill';
      start: number;
      size: number;
      steepness: number;
    };

const config: {
  sections: Section[];
} = {
  sections: [
    {
      kind: 'uphill',
      start: 100,
      size: 700,
      steepness: 30,
    },
    {
      kind: 'turn-left',
      start: 1000,
      size: 600,
    },
    {
      kind: 'turn-right',
      start: 1500,
      size: 1000,
    },
    {
      kind: 'downhill',
      start: 2600,
      size: 700,
      steepness: 50,
    },
  ],
};

function draw() {
  ctx.clearRect(0, 0, IW, IH);

  grid();

  let activeSection: Section = config.sections.find((s) => {
    return state.moveOffset >= s.start && state.moveOffset <= s.start + s.size;
  });
  if (!activeSection || hasSectionEnded(activeSection)) {
    activeSection = { start: state.moveOffset, kind: 'straight', size: 0 };
  }

  const inSectionOffset = state.moveOffset - activeSection.start;

  drawInfo({ section: activeSection.kind });

  if (activeSection.kind === 'straight') {
    drawHorizon();
    drawPath(straightFragment);
    drawCar();
    return;
  }

  if (
    activeSection.kind === 'turn-right' ||
    activeSection.kind === 'turn-left'
  ) {
    if (state.moveSpeed > 0) {
      if (activeSection.kind === 'turn-left') {
        state.steerOffset -= STEER_TURN_COUNTER_FORCE;
      } else if (activeSection.kind === 'turn-right') {
        state.steerOffset += STEER_TURN_COUNTER_FORCE;
      }
    }

    const fragments = createTurn({
      size: activeSection.size,
      direction: activeSection.kind === 'turn-right' ? 'right' : 'left',
    });

    const strFragments = steerFragments(fragments, state.steerOffset);

    const path = lerpSectionFragments({
      fragments: strFragments,
      inSectionOffset,
    });

    drawHorizon();
    drawPath(path);
    drawCar();
    return;
  }

  if (activeSection.kind === 'downhill') {
    const fragments = createDownhill({
      size: activeSection.size,
      inOffset: inSectionOffset,
      steepness: activeSection.steepness,
    });
    const steeredFragments = steerFragments(fragments, state.steerOffset);

    const path = lerpSectionFragments({
      fragments: steeredFragments,
      inSectionOffset,
    });

    const yOverride = path.left[3];

    drawHorizon({ yOverride });

    drawPath(path);

    drawCar();

    return;
  }

  if (activeSection.kind === 'uphill') {
    const fragments = createUphill({
      size: activeSection.size,
      inOffset: inSectionOffset,
      steepness: activeSection.steepness,
    });
    const steeredFragments = steerFragments(fragments, state.steerOffset);

    const path = lerpSectionFragments({
      fragments: steeredFragments,
      inSectionOffset,
    });

    const yOverride = path.left[3];

    drawHorizon({ yOverride });

    drawPath(path);

    drawCar();

    return;
  }
}

function lerpSectionFragments({
  fragments,
  inSectionOffset,
}: {
  fragments: Fragment[];
  inSectionOffset: number;
}) {
  const activeIndex = fragments.findIndex((fragment) => {
    return inSectionOffset < fragment.end;
  });
  const prevIndex = activeIndex !== -1 ? activeIndex - 1 : -1;

  const prevFragment = fragments[prevIndex] || straightFragment;
  const activeFragment = fragments[activeIndex] || straightFragment;

  let d = 0;

  const fragmentSize = activeFragment.end - prevFragment.end;
  const inFragmentOffset = inSectionOffset - prevFragment.end;
  if (fragmentSize !== 0) {
    d = inFragmentOffset / fragmentSize;
  }

  const path = lerpPath(prevFragment, activeFragment, d);

  return path;
}

function hasSectionEnded(section: Section) {
  return section.start + section.size < state.moveOffset;
}

function createDownhill({
  size,
  steepness,
  inOffset,
}: {
  size: number;
  steepness: number;
  inOffset: number;
}): Fragment[] {
  const halfSize = size / 2;
  const d = 1 - Math.abs((inOffset - halfSize) / halfSize);
  const yOffset = -steepness * d;
  const y = HH + yOffset;
  const minY = HH - steepness;

  return [
    {
      left: [HW, HH, HW - 10, y],
      right: [HW, HH, HW + 10, y],
      end: 100,
    },
    {
      left: [HW - 25, HH + 25, HW - 10, minY],
      right: [HW + 25, HH + 25, HW + 10, minY],
      end: 200,
    },
    {
      left: [HW - 25, HH + 15, HW - 10, minY],
      right: [HW + 25, HH + 15, HW + 10, minY],
      end: size - 200,
    },
    {
      left: [HW - 30, HH + 25, HW - 10, y],
      right: [HW + 30, HH + 25, HW + 10, y],
      end: size - 100,
    },
    {
      ...straightFragment,
      end: size,
    },
  ];
}

function createUphill({
  size,
  steepness,
  inOffset,
}: {
  size: number;
  steepness: number;
  inOffset: number;
}): Fragment[] {
  const halfSize = size / 2;
  const d = 1 - Math.abs((inOffset - halfSize) / halfSize);
  const yOffset = steepness * d;
  const y = HH + yOffset;
  const maxY = HH + steepness;

  const xCorrection = state.steerOffset * 0.15;
  const bottomLeftCorrection = state.steerOffset * 0.1;
  const cxCorrection = state.steerOffset * 0.2;

  return [
    {
      left: [HW - 70, y - 5, HW - 60 + xCorrection, y],
      right: [HW + 70, y - 5, HW + 60 + xCorrection, y],
      bottomLeft: [-180 - bottomLeftCorrection, 0],
      bottomRight: [560 - bottomLeftCorrection, 0],
      end: 200,
    },
    {
      left: [HW - 120 + cxCorrection, HH + 30, HW - 90 + xCorrection, maxY],
      right: [HW + 120 + cxCorrection, HH + 30, HW + 90 + xCorrection, maxY],
      bottomLeft: [-180 - bottomLeftCorrection, 0],
      bottomRight: [560 - bottomLeftCorrection, 0],
      end: 300,
    },
    {
      left: [HW - 120 + cxCorrection, HH + 30, HW - 90 + xCorrection, maxY],
      right: [HW + 120 + cxCorrection, HH + 30, HW + 90 + xCorrection, maxY],
      bottomLeft: [-180 - bottomLeftCorrection, 0],
      bottomRight: [560 - bottomLeftCorrection, 0],
      end: size - 200,
    },
    {
      ...straightFragment,
      end: size,
    },
  ];
}

function createTurn({
  size,
  direction,
}: {
  size: number;
  direction: 'right' | 'left';
}): Fragment[] {
  console.assert(size >= 600, 'turn too quick: %d', size);
  const fragments: Fragment[] = [
    // {
    //   left: [HW - 10, HH - 5, HW - 10, HH],
    //   right: [HW + 190, HH + 50, HW + 10, HH],
    //   end: 100,
    // },
    {
      left: [HW - 20, HH - 5, HW + 20, HH],
      right: [HW + 10, HH, HW + 20, HH],
      end: 100,
    },
    {
      left: [HW - 50, HH - 5, HW + 115, HH],
      right: [HW - 15, HH, HW + 115, HH],
      end: 200,
    },
    {
      left: [HW - 30, HH - 5, HW + 80, HH],
      right: [HW - 15, HH + 5, HW + 115, HH],
      end: size - 200,
    },
    {
      left: [HW - 30, HH - 5, HW + 60, HH],
      right: [HW + 0, HH + 20, HW + 80, HH],
      end: size - 100,
    },
    {
      ...straightFragment,
      end: size,
    },
  ];

  if (direction === 'left') {
    return mirrorFragments(fragments);
  }

  return fragments;
}

function mirrorFragments(fragments: Fragment[]): Fragment[] {
  return fragments.map((f) => {
    const l = f.left;
    const r = f.right;
    return {
      ...f,
      left: [HW + (HW - r[0]), r[1], HW + (HW - r[2]), r[3]],
      right: [HW + (HW - l[0]), l[1], HW + (HW - l[2]), l[3]],
    };
  });
}

function steerFragments(
  fragments: Fragment[],
  steerOffset: number,
): Fragment[] {
  const topOffset = steerOffset * 0.01;

  return fragments.map((f) => {
    const l = f.left;
    const r = f.right;
    return {
      ...f,
      left: [l[0] + topOffset, l[1], l[2] + topOffset, l[3]],
      right: [r[0] + topOffset, r[1], r[2] + topOffset, r[3]],
    };
  });
}

function lerpPath(
  p1: PathDescriptor,
  p2: PathDescriptor,
  d: number,
): PathDescriptor {
  return {
    left: lerpLine(p1.left, p2.left, d),
    right: lerpLine(p1.right, p2.right, d),
  };
}

function lerpLine(
  l1: LineDescriptor,
  l2: LineDescriptor,
  d: number,
): LineDescriptor {
  console.assert(d >= 0 && d <= 1, 'd must be normalized: %d', d);

  const cpx = l1[0] + (l2[0] - l1[0]) * d;
  const cpy = l1[1] + (l2[1] - l1[1]) * d;
  const x = l1[2] + (l2[2] - l1[2]) * d;
  const y = l1[3] + (l2[3] - l1[3]) * d;

  return [cpx, cpy, x, y];
}

function drawHorizon({ yOverride }: { yOverride?: number } = {}) {
  ctx.strokeStyle = 'green';
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(0, yOverride ?? HH);
  ctx.lineTo(IW, yOverride ?? HH);
  ctx.stroke();
}

function grid() {
  ctx.setLineDash([]);
  ctx.strokeStyle = '#cccccc77';

  ctx.moveTo(HW, 0);
  ctx.lineTo(HW, IH);
  ctx.stroke();
}

function drawInfo({ section }: { section?: string } = {}) {
  ctx.strokeStyle = '#000';
  ctx.font = '8px serif';

  ctx.strokeText(`move offset: ${state.moveOffset}`, 5, 10);
  ctx.strokeText(`steer: ${state.steerOffset}`, 5, 30);

  if (section) {
    ctx.strokeText(`section kind: ${section}`, 5, 20);
  }
}

function getScale() {
  const pl1 = { x: 180, y: 100 };
  const pl2 = { x: 0, y: 150 };
  const pl3 = { x: -180, y: 200 };

  const l1 = lineLength(pl1, pl2);
  const l2 = lineLength(pl1, pl3);

  const dx = (pl2.x - pl1.x) / (pl3.x - pl1.x);

  console.log({ l1, l2, d: l1 / l2, dx });
}

function lineLength(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function drawPath(
  { left, right, bottomLeft, bottomRight }: PathDescriptor,
  { color = 'red' }: { color?: string } = {},
) {
  ctx.strokeStyle = color;
  ctx.setLineDash([10]);
  ctx.lineDashOffset = state.moveOffset;

  // (0, 150) (180, 100)
  // 5x + 18y = 2700
  // 5x = 2700 - 18y
  // x = (2700 - 18y) / 5
  // x = (2700 - 18 * 200) / 5

  const steerOffset = state.steerOffset * 1;

  const bottomLeftX = bottomLeft?.[0] ?? -180;
  const bottomRightX = bottomRight?.[0] ?? 560;

  ctx.beginPath();
  ctx.moveTo(bottomLeftX + steerOffset, 200);
  ctx.quadraticCurveTo(...left);
  ctx.stroke();

  // 18 y - 5 x = 800
  // -5x = 800 - 18y
  // 5x = 18y - 800
  // x = (18y - 800) / 5
  // x = (18 * 200 - 800) / 5

  ctx.beginPath();
  ctx.moveTo(bottomRightX + steerOffset, 200);
  ctx.quadraticCurveTo(...right);
  ctx.stroke();
}

function drawCar() {
  const image = images.car;
  const scale = 0.6;

  const centerX = (IW - image.width * scale) / 2;
  const steerOffset = -1 * state.steerOffset * 0.02;

  const x = centerX + steerOffset;
  const y = 130;

  ctx.drawImage(images.car, x, y, image.width * scale, image.height * scale);
}

async function loadImage(imagePath: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.src = imagePath;
    image.addEventListener('load', () => {
      resolve(image);
    });
  });
}

async function main() {
  images.car = await loadImage('data/graphics/car.png');

  loop();
}

function loop() {
  if (getKeys().includes(Keycodes.Up)) {
    state.moveSpeed = MOVE_SPEED;
    state.moveOffset += state.moveSpeed;
  } else if (getKeys().includes(Keycodes.Down)) {
    state.moveSpeed = MOVE_SPEED;
    state.moveOffset -= state.moveSpeed;
  } else {
    state.moveSpeed = 0;
  }

  if (getKeys().includes(Keycodes.Left)) {
    state.steerSpeed = STEER_SPEED;
    const nextOffset = state.steerOffset + state.steerSpeed;
    state.steerOffset = Math.min(STEER_LIMIT, nextOffset);
  } else if (getKeys().includes(Keycodes.Right)) {
    state.steerSpeed = STEER_SPEED;
    const nextOffset = state.steerOffset - state.steerSpeed;
    state.steerOffset = Math.max(-STEER_LIMIT, nextOffset);
  } else {
    state.steerSpeed = 0;
  }

  draw();

  requestAnimationFrame(loop);
}

main();
