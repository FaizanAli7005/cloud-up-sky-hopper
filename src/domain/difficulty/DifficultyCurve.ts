import { GAME_BALANCE } from "../balance";

export interface DifficultyCurve {
  getSpeed(elapsedSeconds: number): number;
}

export class LinearDifficultyCurve implements DifficultyCurve {
  getSpeed(elapsedSeconds: number): number {
    return Math.min(
      GAME_BALANCE.maxSpeed,
      GAME_BALANCE.baseSpeed + GAME_BALANCE.speedRampPerSecond * elapsedSeconds
    );
  }
}
