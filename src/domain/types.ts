export type EntityKind = "player" | "obstacle" | "collectible";
export type ObstacleType = "bird" | "storm" | "balloon";
export type CollectibleType = "star" | "boost";

export interface Vector2 {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameInput {
  leftHeld: boolean;
  rightHeld: boolean;
  boostHeld: boolean;
}

export interface EntitySnapshot extends Bounds {
  id: string;
}

export interface ObstacleSnapshot extends EntitySnapshot {
  type: ObstacleType;
}

export interface CollectibleSnapshot extends EntitySnapshot {
  type: CollectibleType;
}

export interface GameSnapshot {
  player: Bounds & { velocityY: number };
  obstacles: ObstacleSnapshot[];
  collectibles: CollectibleSnapshot[];
  score: number;
  highScore: number;
  currentCombo: number;
  bestCombo: number;
  bonusTimeRemaining: number;
  speed: number;
  elapsedSeconds: number;
  isGameOver: boolean;
}

export interface SimulatedEntity {
  readonly id: string;
  readonly kind: EntityKind;
  getBounds(): Bounds;
  update(deltaSeconds: number): void;
}
