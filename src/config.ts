export const VERSION = '0.1.0';

export const RENDER_SCALE = 1.5;
export const RS = RENDER_SCALE;

export const BW = 380 * RENDER_SCALE;
export const BH = 200 * RENDER_SCALE;

const MULT_KEY = 'gimmeabreak.mult';
const DEFAULT_MULT = 1.5;
export const MULT_OPTIONS = [1, 1.5, 2];

let mult = JSON.parse(localStorage.getItem(MULT_KEY)) || DEFAULT_MULT;

export function MULT() {
  return mult;
}

export function setMult(m: number) {
  console.assert(MULT_OPTIONS.includes(m), 'mult must be one of');
  mult = m;
  localStorage.setItem(MULT_KEY, JSON.stringify(m));
}

export function displayMult(m: number) {
  return m - 0.5;
}

export const IW = BW;
export const IH = BH;
export const HW = IW / 2; // half = 190
export const HH = IH / 2; // half = 100

export const STEER_LIMIT = Infinity;
export const STEER_TURN_COUNTER_FORCE = 4 * RS;

export const STEER_SPEED = 5 * RS;
export const STEER_SPEED_IMPROVED = 8 * RS;

export const BG_SPEED_PER_MOVE_OFFSET = 0.4;

export const MOVE_ACCELERATION = 0.03;
export const MOVE_DECELERATION_UPHILL_UPGRADE = 0.01;
export const MOVE_DECELERATION_BUMPER_UPGRADE = 0.07;
export const MOVE_DECELERATION_PARACHUTE_UPGRADE = 0.15;
export const MOVE_DECELERATION_NITRO_UPGRADE = 0.11;
export const MOVE_DECELERATION_POLE = 0.1;
export const MOVE_DECELERATION_FREE = 0.05;
export const MOVE_DECELERATION_REVERSE = 0.1;
export const MOVE_DECELERATION_DEATH = 0.2;

export const MOVE_SPEED_MAX = 8;
export const MOVE_SPEED_MAX_UPGRADE = 7;

export const POLE_START = 1000;
export const POLE_DRIVE = 500;
export const POLE_FULL_STOP = 100;

export const FONT_PRIMARY = 'retro_gaming';

export const SOUND_MENU_SELECT_ID = 'menuSelect1';
export const SOUND_MENU_FOCUS_ID = 'menuFocus1';
export const SOUND_MENU_THEME_ID = 'menu3';
export const SOUND_GAME_THEME_ID = 'theme1';
export const SOUND_CURB_ID = 'curb2';
export const SOUND_DEATH_ID = 'death1';
export const SOUND_HIT_ID = 'hit1';
export const SOUND_LIFE_LOST_ID = 'life1';
export const SOUND_BRAKE_ID = 'brake2';
export const SOUND_BUMPER_ID = 'bumper1';
export const SOUND_NITRO_ID = 'brake3';

export const ITCH_LINK = 'https://heckx2.itch.io/';
export const TSYD_LINK = 'https://www.instagram.com/tsydit/';
