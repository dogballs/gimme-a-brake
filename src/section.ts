import { POLE_START } from './config';
import {
  straightFragment,
  createTurn,
  createUphill,
  createDownhill,
  lerpFragments,
} from './fragment';
import { Path } from './path';
import { randomElement, randomNumber } from './random';
import { Zone } from './zone';

export type Section =
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

export function createSectionFragments({
  section,
  moveOffset,
  steerOffset,
}: {
  section: Section;
  moveOffset: number;
  steerOffset: number;
}): {
  path: Path;
  yOverride?: number;
} {
  const inSectionOffset = moveOffset - section.start;

  if (section.kind === 'straight') {
    return { path: straightFragment };
  }

  if (section.kind === 'turn-right' || section.kind === 'turn-left') {
    const fragments = createTurn({
      size: section.size,
      direction: section.kind === 'turn-right' ? 'right' : 'left',
      steerOffset,
    });

    const path = lerpFragments({
      fragments,
      inOffset: inSectionOffset,
    });

    return { path };
  }

  if (section.kind === 'downhill') {
    const fragments = createDownhill({
      size: section.size,
      inOffset: inSectionOffset,
      steepness: section.steepness,
      steerOffset,
    });

    const path = lerpFragments({
      fragments,
      inOffset: inSectionOffset,
    });

    const yOverride = path.left.topY;

    return { path, yOverride };
  }

  if (section.kind === 'uphill') {
    const fragments = createUphill({
      size: section.size,
      inOffset: inSectionOffset,
      steepness: section.steepness,
      steerOffset,
    });

    const path = lerpFragments({
      fragments,
      inOffset: inSectionOffset,
    });

    const yOverride = path.left.topY;

    return { path, yOverride };
  }

  throw new Error(`Unknown section: "${section.kind}"`);
}

export function getActiveSection({
  sections,
  moveOffset,
}: {
  sections: Section[];
  moveOffset: number;
}) {
  let activeSection: Section = sections.find((s) => {
    return moveOffset >= s.start && moveOffset <= s.start + s.size;
  });
  if (!activeSection || hasSectionEnded(activeSection, moveOffset)) {
    activeSection = { start: moveOffset, kind: 'straight', size: 0 };
  }
  return activeSection;
}

export function getNextSection({
  sections,
  moveOffset,
}: {
  sections: Section[];
  moveOffset: number;
}): Section | undefined {
  const activeSectionIndex = sections.findIndex((s) => {
    return moveOffset >= s.start && moveOffset <= s.start + s.size;
  });
  if (activeSectionIndex !== -1) {
    const nextSectionIndex = activeSectionIndex + 1;
    return sections[nextSectionIndex];
  }
  return sections.find((s) => {
    return s.start > moveOffset;
  });
}

function hasSectionEnded(section: Section, moveOffset: number) {
  return section.start + section.size < moveOffset;
}

export function generateSectionsForZones({ zones }: { zones: Zone[] }) {
  const sections: Section[] = [];

  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    const nextZone = zones[i + 1];

    const zoneStart = zone.start + POLE_START;
    const zoneSize = nextZone ? nextZone.start - zoneStart - POLE_START : 0;

    let start = zoneStart;
    while (start < zoneStart + zoneSize) {
      let size;
      const kind = randomElement([
        'straight',
        'uphill',
        'downhill',
        'turn-left',
        'turn-right',
      ]);
      switch (kind) {
        case 'straight':
        case 'turn-left':
        case 'turn-right':
          size = randomNumber(1000, 3000);
          sections.push({ kind, size, start });
          size += 300;
          break;
        case 'uphill': {
          size = randomNumber(1500, 3000);
          const steepness = randomNumber(25, 35);
          sections.push({ kind, size, start, steepness });
          size += 300;
          break;
        }
        case 'downhill': {
          size = randomNumber(1500, 3000);
          const steepness = randomNumber(45, 55);
          sections.push({ kind, size, start, steepness });
          size += 300;
          break;
        }
      }
      start += size;
    }
  }

  return sections;
}
