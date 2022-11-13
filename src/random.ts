export function randomElement<T>(items: T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export function randomNumber(from: number = 0, to: number = 1) {
  return Math.floor(Math.random() * (to - from + 1) + from);
}
