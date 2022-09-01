const turnSize = 500;
const list = [
  // [turnSize, 100, 0.2],
  // [turnSize, 90, 0.2],
  [turnSize, 80, 0.2],
  // [turnSize, 70, 0.2],
  // [turnSize, 60, 0.05],
  // [turnSize, 60, 0.1],
  // [turnSize, 50, 0.05],
  // [turnSize, 40, 0.05],
  // [turnSize, 30, 0.05],
  [0, 120, 0],
];

function lerp(entryIndex: number, offset: number) {
  const entry = list[entryIndex];
  const nextEntry = list[entryIndex - 1] || list[0];

  const into = offset - entry[0];
  const size = nextEntry[0] - entry[0];
  const percent = into / size;

  return [
    entry[0] + into,
    entry[1] + (nextEntry[1] - entry[1]) * percent,
    entry[2] + (nextEntry[2] - entry[2]) * percent,
  ];
}

export function getCurvedWidthList({
  roadHeight,
  imageWidth,
  moveOffset,
  turnStart,
  turnEnd,
}: {
  roadHeight: number;
  imageWidth: number;
  moveOffset: number;
  turnStart: number;
  turnEnd: number;
}) {
  // console.log({ moveOffset, turnStart, turnEnd });
  const inTurn = moveOffset > turnStart && moveOffset < turnEnd;
  const isEntering = inTurn && moveOffset - turnStart < turnSize;
  const isExiting = inTurn && turnEnd - moveOffset < turnSize;
  const isProgress = inTurn && !isEntering && !isExiting;

  const inTurnStart = moveOffset - turnStart;

  let curveTopStart = 120;
  let curveTopOffsetMult = 0;

  if (isEntering) {
    console.log('isEntering');
    const offset = Math.max(0, moveOffset - turnStart);
    const entryIndex = list.findIndex((e) => e[0] < offset);
    const entry = list[entryIndex];
    const l = lerp(entryIndex, offset);

    curveTopStart = l[1];
    curveTopOffsetMult = l[2];
  }
  if (isProgress) {
    console.log('isProgress');
    curveTopStart = list[0][1];
    curveTopOffsetMult = list[0][2];
  }
  if (isExiting) {
    console.log('isExiting');
    const offset = turnEnd - moveOffset;
    const entryIndex = list.findIndex((e) => e[0] < offset);
    const entry = list[entryIndex];
    const l = lerp(entryIndex, offset);

    curveTopStart = l[1];
    curveTopOffsetMult = l[2];
  }

  // const curveTopStart = 70; //roadHeight - curveTopStartBox.get();
  // const curveBottomStart = curveBottomStartValue.get();
  // const curveTopOffsetMult = 0.2; //curveTopOffsetMultBox.get();

  const NEAR_WIDTH = 600;

  const perIterationReduce = 2.3; //widthPerLineReduceBox.get();

  let topOffset = 0;
  let perIterationTopOffset = 0;

  let bottomOffset = 0;
  let perIterationBottomOffset = 0;

  const widthList = [];

  for (let i = 0; i <= roadHeight; i++) {
    const widthReduce = i * perIterationReduce;
    const straightX = imageWidth / 2 - NEAR_WIDTH / 2 + widthReduce;
    const width = NEAR_WIDTH - widthReduce * 2;

    const topCurveX = straightX - topOffset;
    const bottomCurveX = straightX - bottomOffset;

    // if (i <= curveBottomStart) {
    //   widthList.push({
    //     x: straightX,
    //     width,
    //   });
    // } else
    if (i >= curveTopStart) {
      widthList.push({
        x: topCurveX,
        width,
      });
      topOffset += perIterationTopOffset;
      perIterationTopOffset += curveTopOffsetMult;
    } else {
      widthList.push({
        x: straightX,
        width,
      });
    }
  }

  return widthList;
}
