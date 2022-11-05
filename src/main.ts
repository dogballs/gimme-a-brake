import { Keycodes, listenKeyboard } from './controls';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const IMAGE_WIDTH = 380;
const IMAGE_HEIGHT = 200;
const WH = IMAGE_WIDTH / 2; // half = 190
const HH = IMAGE_HEIGHT / 2; // half = 100

canvas.width = IMAGE_WIDTH;
canvas.height = IMAGE_HEIGHT;

canvas.addEventListener('click', (ev) => {
  console.log(ev.clientX / 2, ev.clientY / 2);
});

const { getKeys } = listenKeyboard();

type LineDescriptor = [number, number, number, number];

type PathDescriptor = {
  left: LineDescriptor;
  right: LineDescriptor;
};

type Fragment = PathDescriptor & { end: number };

const straightFragment: Fragment = {
  left: [0, 150, 180, 100],
  right: [380, 150, 200, 100],
  end: 0,
};

function createTurn({
  size,
  direction,
}: {
  size: number;
  direction: 'right' | 'left';
}): Fragment[] {
  console.assert(size >= 600, 'turn too quick: %d', size);
  const fragments: Fragment[] = [
    {
      left: [180, 95, 180, 100],
      right: [380, 150, 200, 100],
      end: 100,
    },
    {
      left: [180, 95, 210, 100],
      right: [170, 95, 220, 100],
      end: 200,
    },
    {
      left: [180, 95, 305, 100],
      right: [220, 100, 305, 100],
      end: 300,
    },
    {
      left: [180, 100, 270, 100],
      right: [200, 105, 305, 100],
      end: size - 200,
    },
    {
      left: [200, 100, 250, 100],
      right: [270, 120, 290, 100],
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

const state = {
  speed: 3,
  moveOffset: 0,
};

type Section = {
  kind: 'straight' | 'turn-right' | 'turn-left';
  start: number;
  size: number;
};

const config: {
  sections: Section[];
} = {
  sections: [
    {
      kind: 'turn-left',
      start: 100,
      size: 600,
    },
    {
      kind: 'turn-right',
      start: 700,
      size: 1000,
    },
  ],
};

function mirrorFragments(fragments: Fragment[]): Fragment[] {
  return fragments.map((f) => {
    const l = f.left;
    const r = f.right;
    return {
      ...f,
      left: [WH + (WH - r[0]), r[1], WH + (WH - r[2]), r[3]],
      right: [WH + (WH - l[0]), l[1], WH + (WH - l[2]), l[3]],
    };
  });
}

function hasSectionEnded(section: Section) {
  return section.start + section.size < state.moveOffset;
}

function draw() {
  ctx.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  grid();
  horizon();

  // drawPath({ ...straightFragment, color: 'yellow' });
  // drawPath({ ...turn1Fragments[3], color: 'blue' });

  // drawPath(turn1Fragments[4]);
  // return;

  // const f1 = turn1Fragments[3];
  // const f2 = turn1Fragments[4];

  // const path = transitionFragments(f1, f2, f1.end + state.moveOffset);

  // drawPath(path);
  // return;

  let activeSection: Section = config.sections.find((s) => {
    return state.moveOffset >= s.start && state.moveOffset <= s.start + s.size;
  });
  if (!activeSection || hasSectionEnded(activeSection)) {
    activeSection = { start: state.moveOffset, kind: 'straight', size: 0 };
  }

  info({ section: activeSection.kind });

  if (activeSection.kind === 'straight') {
    drawPath(straightFragment);
    return;
  }

  if (
    activeSection.kind === 'turn-right' ||
    activeSection.kind === 'turn-left'
  ) {
    const inSectionOffset = state.moveOffset - activeSection.start;

    const turnFragments = createTurn({
      size: activeSection.size,
      direction: activeSection.kind === 'turn-right' ? 'right' : 'left',
    });

    const activeIndex = turnFragments.findIndex((fragment) => {
      return inSectionOffset < fragment.end;
    });
    const prevIndex = activeIndex !== -1 ? activeIndex - 1 : -1;

    const prevFragment = turnFragments[prevIndex] || straightFragment;
    const activeFragment = turnFragments[activeIndex] || straightFragment;

    let d = 0;

    const fragmentSize = activeFragment.end - prevFragment.end;
    const inFragmentOffset = inSectionOffset - prevFragment.end;
    if (fragmentSize !== 0) {
      d = inFragmentOffset / fragmentSize;
    }

    const path = lerpPath(prevFragment, activeFragment, d);
    drawPath(path);
    return;
  }
}

function transitionFragments(
  f1: Fragment,
  f2: Fragment,
  inSectionOffset: number,
): PathDescriptor {
  const size = f2.end - f1.end;
  const internalOffset = inSectionOffset - f1.end;

  let d = 0;
  if (size !== 0) {
    d = internalOffset / size;
  }

  return lerpPath(f1, f2, d);
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

function horizon() {
  ctx.strokeStyle = 'green';
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(0, IMAGE_HEIGHT / 2);
  ctx.lineTo(IMAGE_WIDTH, IMAGE_HEIGHT / 2);
  ctx.stroke();
}

function grid() {
  ctx.setLineDash([]);
  ctx.strokeStyle = '#cccccc77';

  ctx.moveTo(IMAGE_WIDTH / 2, 0);
  ctx.lineTo(IMAGE_WIDTH / 2, IMAGE_HEIGHT);
  ctx.stroke();
}

function info({ section }: { section: string }) {
  ctx.strokeStyle = '#000';
  ctx.font = '8px serif';

  ctx.strokeText(`move offset: ${state.moveOffset}`, 5, 10);
  ctx.strokeText(`section kind: ${section}`, 5, 20);
}

function drawPath({
  left,
  right,
  color = 'red',
}: PathDescriptor & { color?: string }) {
  ctx.strokeStyle = color;
  ctx.setLineDash([10]);
  ctx.lineDashOffset = state.moveOffset;

  ctx.beginPath();
  ctx.moveTo(0, 150);
  ctx.quadraticCurveTo(...left);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(380, 150);
  ctx.quadraticCurveTo(...right);
  ctx.stroke();
}

function main() {
  loop();
}

function loop() {
  if (getKeys().includes(Keycodes.Up)) {
    state.moveOffset += state.speed;
  } else if (getKeys().includes(Keycodes.Down)) {
    state.moveOffset -= state.speed;
  }

  draw();

  requestAnimationFrame(loop);
}

main();
