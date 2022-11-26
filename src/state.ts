import {
  defaultSteerState,
  defaultCarState,
  SteerState,
  CarState,
} from './car';
import { defaultMenuState, MenuState } from './menu';
import { SpeedState, defaultMoveSpeedState } from './speed';
import { defaultUpgradeState, UpgradeState } from './upgrade';

type GlobalState = {
  gotReset: boolean;
  speedState: SpeedState;
  steerState: SteerState;
  upgradeState: UpgradeState;
  carState: CarState;
  menuState: MenuState;
  moveOffset: number;
  moveOffsetChange: number;
  bgOffset: number;
};

const defaultGlobalState = {
  gotReset: false,
  speedState: defaultMoveSpeedState,
  steerState: defaultSteerState,
  upgradeState: defaultUpgradeState,
  carState: defaultCarState,
  menuState: defaultMenuState,
  moveOffset: 0,
  moveOffsetChange: 0,
  bgOffset: 0,
};

export function createGlobalState() {
  return JSON.parse(JSON.stringify(defaultGlobalState));
}

export type ResetGlobalState = (override: Partial<GlobalState>) => void;

export function createResetGlobalState(state: GlobalState): ResetGlobalState {
  return (override: Partial<GlobalState> = {}) => {
    Object.assign(state, {
      ...createGlobalState(),
      ...override,
    });
  };
}
