export const RENDER_SCALE = 1;
export const RS = RENDER_SCALE;

export const BW = 380 * RENDER_SCALE;
export const BH = 200 * RENDER_SCALE;

export const IW = BW;
export const IH = BH;
export const HW = IW / 2; // half = 190
export const HH = IH / 2; // half = 100

export const STEER_LIMIT = Infinity;
export const STEER_TURN_COUNTER_FORCE = 4 * RS;

export const MOVE_SPEED = 4 * RS;

export const STEER_SPEED = 5 * RS;
export const STEER_SPEED_IMPROVED = 8 * RS;

export const BG_SPEED_PER_MOVE_OFFSET = 0.4;

export const MOVE_ACCELERATION = 0.03;
export const MOVE_DECELERATION_FREE = 0.05;
export const MOVE_DECELERATION_REVERSE = 0.1;

export const MOVE_SPEED_MAX = 8;

export const MOVE_GEARS = {
  1: { delim: 4, startAt: 0, endAt: 1.1 },
  2: { delim: 5, startAt: 1, endAt: 2.6 },
  3: { delim: 6, startAt: 2.5, endAt: 4.1 },
  4: { delim: 7, startAt: 4, endAt: 6.1 },
  5: { delim: 8, startAt: 6, endAt: MOVE_SPEED_MAX },
};

// export

export const MOVE_GEAR_MIN = Number(Object.keys(MOVE_GEARS).shift());
export const MOVE_GEAR_MAX = Number(Object.keys(MOVE_GEARS).pop());
