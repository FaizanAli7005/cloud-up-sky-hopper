import { describe, expect, it } from "vitest";
import { GAME_BALANCE } from "../../src/domain/balance";
import { LinearDifficultyCurve } from "../../src/domain/difficulty/DifficultyCurve";
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
  const threat = snapshot.obstacles
    .filter((obstacle) => obstacle.y > -180 && obstacle.y < snapshot.player.y + snapshot.player.height)
    .sort((a, b) => b.y - a.y)[0];

  let targetX = GAME_BALANCE.worldWidth * 0.5;

  if (threat) {
    const threatCenter = threat.x + threat.width / 2;
    targetX = threatCenter < GAME_BALANCE.worldWidth * 0.5 ? GAME_BALANCE.worldWidth - 130 : 52;
  }

  const leftHeld = snapshot.player.x > targetX + 18;
  const rightHeld = snapshot.player.x < targetX - 18;
  const targetY = 282;
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
