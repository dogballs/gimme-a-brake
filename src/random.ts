export function randomElement<T>(items: readonly T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export function randomElementDistributed<T>(
  items: readonly T[],
  distributions: readonly number[],
) {
  const number = Math.random();
  const index = distributions.findIndex((d) => {
    return d > number;
  });
  return { item: items[index], index };
}

export function randomElements<T>(items: readonly T[], count: number): T[] {
  const clonedItems = items.slice();

  const pickedItems: T[] = [];

  for (let i = 0; i < Math.min(items.length, count); i++) {
    const index = Math.floor(Math.random() * clonedItems.length);
    pickedItems.push(...clonedItems.splice(index, 1));
  }

  return pickedItems;
}

export function randomNumber(from: number = 0, to: number = 1) {
  return Math.floor(Math.random() * (to - from + 1) + from);
}
