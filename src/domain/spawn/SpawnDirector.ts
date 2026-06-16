import { GAME_BALANCE } from "../balance";
import { Collectible } from "../entities/Collectible";
import { MovingHazard } from "../entities/MovingHazard";
import { RandomSource } from "../random/RandomSource";
import { SimulatedEntity } from "../types";

export interface SpawnDirector {
  update(deltaSeconds: number, elapsedSeconds: number): SimulatedEntity[];
}

export class SkyHopperSpawnDirector implements SpawnDirector {
  private nextSpawnIn = 1.1;
  private serial = 0;

  constructor(
    private readonly random: RandomSource,
    private readonly speedProvider: () => number
  ) {}

  update(deltaSeconds: number, elapsedSeconds: number): SimulatedEntity[] {
    this.nextSpawnIn -= deltaSeconds;
    if (this.nextSpawnIn > 0) {
      return [];
    }

    const entities: SimulatedEntity[] = [this.createHazard()];
    if (elapsedSeconds > 6 && this.random.next() > 0.45) {
      entities.push(this.random.next() > 0.84 ? this.createBoostBonus() : this.createStar());
    }

    const speedPressure = Math.min(1, elapsedSeconds / 90);
    this.nextSpawnIn = this.random.between(
      GAME_BALANCE.minimumSpawnGap,
      GAME_BALANCE.maximumSpawnGap - speedPressure * 0.4
    );

    return entities;
  }

  private createHazard(): MovingHazard {
    const variant = this.random.pick([
      { type: "bird" as const, width: 64, height: 42 },
      { type: "storm" as const, width: 70, height: 68 },
      { type: "windmill" as const, width: 76, height: 76 },
      { type: "balloon" as const, width: 52, height: 84 }
    ]);

    return new MovingHazard(
      `obstacle-${this.serial++}`,
      variant.type,
      this.random.between(72, GAME_BALANCE.worldWidth - variant.width - 72),
      GAME_BALANCE.spawnY - this.random.between(0, 90),
      variant.width,
      variant.height,
      this.speedProvider
    );
  }

  private createStar(): Collectible {
    return new Collectible(
      `star-${this.serial++}`,
      "star",
      this.random.between(82, GAME_BALANCE.worldWidth - 82),
      GAME_BALANCE.spawnY - this.random.between(140, 260),
      32,
      this.speedProvider
    );
  }

  private createBoostBonus(): Collectible {
    return new Collectible(
      `boost-${this.serial++}`,
      "boost",
      this.random.between(92, GAME_BALANCE.worldWidth - 92),
      GAME_BALANCE.spawnY - this.random.between(160, 300),
      38,
      this.speedProvider
    );
  }
}
