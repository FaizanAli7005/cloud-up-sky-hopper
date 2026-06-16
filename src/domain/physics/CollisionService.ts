import { Bounds } from "../types";

export interface CollisionService {
  overlaps(a: Bounds, b: Bounds): boolean;
}

export class AxisAlignedCollisionService implements CollisionService {
  overlaps(a: Bounds, b: Bounds): boolean {
    const insetA = this.getHitboxInset(a);
    const insetB = this.getHitboxInset(b);

    return (
      a.x + insetA < b.x + b.width - insetB &&
      a.x + a.width - insetA > b.x + insetB &&
      a.y + insetA < b.y + b.height - insetB &&
      a.y + a.height - insetA > b.y + insetB
    );
  }

  private getHitboxInset(bounds: Bounds): number {
    return Math.min(16, bounds.width * 0.22, bounds.height * 0.22);
  }
}
