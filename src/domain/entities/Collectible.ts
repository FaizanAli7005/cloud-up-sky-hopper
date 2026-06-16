import { Bounds, CollectibleType, EntityKind, SimulatedEntity } from "../types";

export class Collectible implements SimulatedEntity {
  readonly kind: EntityKind = "collectible";

  constructor(
    readonly id: string,
    readonly collectibleType: CollectibleType,
    private readonly x: number,
    private y: number,
    private readonly size: number,
    private readonly speedProvider: () => number
  ) {}

  update(deltaSeconds: number): void {
    this.y += this.speedProvider() * deltaSeconds;
  }

  getBounds(): Bounds {
    return {
      x: this.x,
      y: this.y,
      width: this.size,
      height: this.size
    };
  }
}
