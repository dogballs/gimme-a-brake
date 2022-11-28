import { defaultCarState, CarState } from './car';
import { defaultEndingState, EndingState } from './ending';
import { defaultMenuState, MenuState } from './menu';
import { SpeedState, defaultMoveSpeedState } from './speed';
import { SteerState, defaultSteerState } from './steer';
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
  endingState: defaultEndingState,
  moveOffset: 16,
  moveOffsetChange: 0,
  bgOffset: 0,
};

export function createGlobalState() {
  return JSON.parse(JSON.stringify(defaultGlobalState));
}

export type ResetGlobalState = (override: Partial<GlobalState>) => void;

export function createResetGlobalState(
  state: GlobalState,
  onReset: () => void,
): ResetGlobalState {
  return (override: Partial<GlobalState> = {}) => {
    Object.assign(state, {
      ...createGlobalState(),
      ...override,
    });
    onReset();
  };
}
