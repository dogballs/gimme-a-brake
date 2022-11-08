export function stripesHeightList({
  roadHeight,
  moveOffset,
  nearTextureHeight = 32,
}: {
  roadHeight: number;
  moveOffset: number;
  nearTextureHeight?: number;
}) {
  const heightList = [];

  // const { moveOffset } = state;
  const isNegativeMoveOffset = moveOffset < 0;

  // Will be used in a function to calculate how much the next road segment will
  // be downscaled compared to the previous one because next segment is further
  // into the road.
  let downscaleIndex = 1;

  // Based on the nearest segment and global offset calculate how much thi
  //  nearest segment is offset from zero position. We are going to offset
  // all of the following segments based on the same percentages.
  let restFillPercent =
    Math.abs(moveOffset % nearTextureHeight) / nearTextureHeight;
  let primFillPercent = 1 - restFillPercent;

  // If we are going below zero swap the percentages because the other texture
  // will be rendered first
  if (isNegativeMoveOffset) {
    primFillPercent = 1 - primFillPercent;
    restFillPercent = 1 - restFillPercent;
  }

  // Figure out which texture is rendered first in the current loop based on the
  // global offset
  let primTextureIndex =
    Math.floor(Math.abs(moveOffset) / nearTextureHeight) % 2;
  // If we are going negative choose the other texture
  if (isNegativeMoveOffset) {
    primTextureIndex = 1 - primTextureIndex;
  }

  let currentY = 0;
  let roadLeftToParse = roadHeight;

  while (roadLeftToParse >= 0) {
    const downscaleMultiplier = 1 / downscaleIndex;
    const segmentHeight = Math.ceil(downscaleMultiplier * nearTextureHeight);

    // Segment is split into two sub-segments based on the global offset.
    // Each segment has it's own texture.
    const primTextureHeight = Math.round(segmentHeight * primFillPercent);
    const restTextureHeight = Math.round(segmentHeight - primTextureHeight);

    // Add both sub-segments as separate entries of their own height with
    // corresponding texture indexes
    if (primTextureHeight !== 0) {
      const y = currentY;

      let y2 = currentY + primTextureHeight;
      let height = Math.max(1, primTextureHeight);
      let heightOverflow = 0;
      if (y2 > roadHeight) {
        heightOverflow = y2 - roadHeight;
        y2 = roadHeight;
        height = Math.max(1, height - heightOverflow);
      }

      heightList.push({
        y,
        y2,
        height,
        textureIndex: primTextureIndex,
      });
    }
    if (restTextureHeight !== 0) {
      const y = currentY + primTextureHeight;
      if (y < roadHeight) {
        let y2 = currentY + segmentHeight;
        let height = Math.max(1, restTextureHeight);
        let heightOverflow = 0;
        if (y2 > roadHeight) {
          heightOverflow = y2 - roadHeight;
          y2 = roadHeight;
          height = Math.max(1, height - heightOverflow);
        }

        heightList.push({
          y,
          y2,
          height,
          textureIndex: 1 - primTextureIndex,
        });
      }
    }

    roadLeftToParse -= segmentHeight;
    currentY += segmentHeight;
    downscaleIndex++;
    // Alernate to the other texture and make it primary
    primTextureIndex = 1 - primTextureIndex;
  }

  return heightList;
}
