import { Bounds, EntityKind, ObstacleType, SimulatedEntity } from "../types";

export class MovingHazard implements SimulatedEntity {
  readonly kind: EntityKind = "obstacle";

  constructor(
    readonly id: string,
    readonly obstacleType: ObstacleType,
    private readonly x: number,
    private y: number,
    private readonly width: number,
    private readonly height: number,
    private readonly speedProvider: () => number
  ) {}

  update(deltaSeconds: number): void {
    this.y += this.speedProvider() * deltaSeconds;
  }

  getBounds(): Bounds {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}
