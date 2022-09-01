export function getStraightWidthList({
  roadHeight,
  imageWidth,
}: {
  roadHeight: number;
  imageWidth: number;
}) {
  let dx = 0;
  const dxx = 1.6;
  const NEAR_WIDTH = 400;

  const widthList = [];

  for (let i = 0; i <= roadHeight; i++) {
    const x = imageWidth / 2 - NEAR_WIDTH / 2 + dx;
    const width = NEAR_WIDTH - dx * 2;

    widthList.push({
      x,
      width,
    });

    dx += dxx;
  }

  return widthList;
}
