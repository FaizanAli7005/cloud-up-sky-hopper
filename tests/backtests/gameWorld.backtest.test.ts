import { describe, expect, it } from "vitest";
import { GAME_BALANCE } from "../../src/domain/balance";
import { LinearDifficultyCurve } from "../../src/domain/difficulty/DifficultyCurve";
import { MovingHazard } from "../../src/domain/entities/MovingHazard";
import { AxisAlignedCollisionService } from "../../src/domain/physics/CollisionService";
import { SeededRandom } from "../../src/domain/random/SeededRandom";
import { SkyHopperSpawnDirector } from "../../src/domain/spawn/SpawnDirector";
import { GameSnapshot } from "../../src/domain/types";
import { GameWorld } from "../../src/domain/world/GameWorld";

function createDeterministicWorld(seed: number): GameWorld {
  const difficulty = new LinearDifficultyCurve();
  let world: GameWorld;
  const spawnDirector = new SkyHopperSpawnDirector(
    new SeededRandom(seed),
    () => difficulty.getSpeed(world?.getSnapshot().elapsedSeconds ?? 0)
  );

  world = new GameWorld(difficulty, new AxisAlignedCollisionService(), spawnDirector);

  return world;
}

function autopilot(snapshot: GameSnapshot) {
  const threats = snapshot.obstacles.filter(
    (obstacle) => obstacle.y > -260 && obstacle.y < snapshot.player.y + snapshot.player.height + 220
  );

  let targetX = GAME_BALANCE.worldWidth * 0.5 - snapshot.player.width / 2;

  if (threats.length > 0) {
    const lanes = [46, 176, 306, 436, 566, 696, 826, 956, 1086, 1216 - snapshot.player.width];
    const playerCenterY = snapshot.player.y + snapshot.player.height / 2;
    targetX = lanes
      .map((lane) => {
        const laneRisk = threats.reduce((risk, obstacle) => {
          const horizontalOverlap = Math.max(
            0,
            Math.min(lane + snapshot.player.width + 18, obstacle.x + obstacle.width) -
              Math.max(lane - 18, obstacle.x)
          );
          const obstacleCenterY = obstacle.y + obstacle.height / 2;
          const verticalPressure = 1 / Math.max(38, Math.abs(obstacleCenterY - playerCenterY));
          return risk + horizontalOverlap * verticalPressure;
        }, Math.abs(lane - snapshot.player.x) * 0.002);
        return { lane, laneRisk };
      })
      .sort((a, b) => a.laneRisk - b.laneRisk)[0].lane;
  }

  const leftHeld = snapshot.player.x > targetX + 18;
  const rightHeld = snapshot.player.x < targetX - 18;
  const targetY = threats.some((obstacle) => obstacle.y > snapshot.player.y - 90 && obstacle.y < snapshot.player.y + 130)
    ? 238
    : 282;
  const boostHeld = snapshot.player.y > targetY || snapshot.player.velocityY > 110;

  return { leftHeld, rightHeld, boostHeld };
}

describe("Cloud Up Sky Hopper deterministic backtests", () => {
  it("keeps a skilled deterministic player alive across multiple long runs", () => {
    for (const seed of [101, 90210, 123456]) {
      const world = createDeterministicWorld(seed);
      let snapshot = world.getSnapshot();

      for (let frame = 0; frame < 60 * 90; frame += 1) {
        snapshot = world.update(1 / 60, autopilot(snapshot));
        expect(snapshot.player.y).toBeGreaterThanOrEqual(GAME_BALANCE.skyTop - 0.01);
        expect(snapshot.player.y + snapshot.player.height).toBeLessThanOrEqual(GAME_BALANCE.skyBottom + 0.01);
        expect(snapshot.speed).toBeLessThanOrEqual(GAME_BALANCE.maxSpeed);
        expect(snapshot.obstacles.length).toBeLessThan(12);
        expect(snapshot.collectibles.length).toBeLessThan(12);
        expect(snapshot.isGameOver).toBe(false);
      }

      expect(snapshot.elapsedSeconds).toBeGreaterThan(89);
      expect(snapshot.score).toBeGreaterThan(1000);
    }
  }, 20_000);

  it("ends the run when the player never uses controls", () => {
    const world = createDeterministicWorld(42);
    let snapshot = world.getSnapshot();

    for (let frame = 0; frame < 60 * 20 && !snapshot.isGameOver; frame += 1) {
      snapshot = world.update(1 / 60, { leftHeld: false, rightHeld: false, boostHeld: false });
    }

    expect(snapshot.isGameOver).toBe(true);
    expect(snapshot.elapsedSeconds).toBeGreaterThan(1);
  });

  it("detects contact with small visible hazards", () => {
    const collisions = new AxisAlignedCollisionService();

    expect(
      collisions.overlaps(
        { x: 100, y: 100, width: GAME_BALANCE.playerWidth, height: GAME_BALANCE.playerHeight },
        { x: 132, y: 116, width: 78, height: 46 }
      )
    ).toBe(true);

    expect(
      collisions.overlaps(
        { x: 100, y: 100, width: GAME_BALANCE.playerWidth, height: GAME_BALANCE.playerHeight },
        { x: 220, y: 116, width: 78, height: 46 }
      )
    ).toBe(false);
  });

  it("ends the run when a spawned hazard touches the player", () => {
    const difficulty = new LinearDifficultyCurve();
    const spawnDirector = {
      update: () => [
        new MovingHazard(
          "forced-hit",
          "bird",
          GAME_BALANCE.playerStartX + 12,
          GAME_BALANCE.playerStartY + 8,
          78,
          46,
          () => 0
        )
      ]
    };
    const world = new GameWorld(difficulty, new AxisAlignedCollisionService(), spawnDirector);

    const snapshot = world.update(1 / 60, { leftHeld: false, rightHeld: false, boostHeld: false });

    expect(snapshot.isGameOver).toBe(true);
  });

  it("uses a monotonic difficulty curve capped by the balance maximum", () => {
    const curve = new LinearDifficultyCurve();

    expect(curve.getSpeed(0)).toBe(GAME_BALANCE.baseSpeed);
    expect(curve.getSpeed(30)).toBeGreaterThan(curve.getSpeed(10));
    expect(curve.getSpeed(10_000)).toBe(GAME_BALANCE.maxSpeed);
  });

  it("produces repeatable random streams for simulation reproducibility", () => {
    const first = new SeededRandom(1234);
    const second = new SeededRandom(1234);

    const firstRun = Array.from({ length: 12 }, () => first.next());
    const secondRun = Array.from({ length: 12 }, () => second.next());

    expect(firstRun).toEqual(secondRun);
  });
});
