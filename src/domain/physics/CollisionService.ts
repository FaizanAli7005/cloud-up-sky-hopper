import { Bounds } from "../types";

export interface CollisionService {
  overlaps(a: Bounds, b: Bounds): boolean;
}

export class AxisAlignedCollisionService implements CollisionService {
  overlaps(a: Bounds, b: Bounds): boolean {
    const padding = 34;

    return (
      a.x + padding < b.x + b.width - padding &&
      a.x + a.width - padding > b.x + padding &&
      a.y + padding < b.y + b.height - padding &&
      a.y + a.height - padding > b.y + padding
    );
  }
}
