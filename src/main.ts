import { Keycodes, listenKeyboard } from './controls';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const IMAGE_WIDTH = 380; // half = 190
const IMAGE_HEIGHT = 200; // half = 100

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

const turnRightFragments: Fragment[] = [
  {
    ...straightFragment,
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
    end: 400,
  },
  {
    ...straightFragment,
    end: 500,
  },
];

const state = {
  speed: 2,
  moveOffset: 0,
};

type Section = {
  kind: 'straight' | 'turn-right';
  start: number;
  size: number;
};

const config: {
  sections: Section[];
} = {
  sections: [
    {
      kind: 'turn-right',
      start: 200,
      size: 500,
    },
  ],
};

function hasSectionEnded(section: Section) {
  return section.start + section.size < state.moveOffset;
}

function draw() {
  ctx.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  grid();
  horizon();

  let activeSection: Section = config.sections.find((s) => {
    return state.moveOffset >= s.start;
  });
  if (!activeSection || hasSectionEnded(activeSection)) {
    activeSection = { start: state.moveOffset, kind: 'straight', size: 0 };
  }

  info({ section: activeSection.kind });

  if (activeSection.kind === 'straight') {
    drawPath(straightFragment);
    return;
  }

  if (activeSection.kind === 'turn-right') {
    const inSectionOffset = state.moveOffset - activeSection.start;

    const activeIndex = turnRightFragments.findIndex((fragment) => {
      return inSectionOffset < fragment.end;
    });
    const prevIndex = activeIndex !== -1 ? activeIndex - 1 : -1;

    const prevFragment = turnRightFragments[prevIndex] || straightFragment;
    const activeFragment = turnRightFragments[activeIndex] || straightFragment;

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

function drawPath({ left, right }: PathDescriptor) {
  ctx.strokeStyle = 'red';
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
