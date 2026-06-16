import { LinearDifficultyCurve } from "../difficulty/DifficultyCurve";
import { AxisAlignedCollisionService } from "../physics/CollisionService";
import { SeededRandom } from "../random/SeededRandom";
import { HighScoreProvider } from "../scoring/ScoreKeeper";
import { SkyHopperSpawnDirector } from "../spawn/SpawnDirector";
import { GameWorld } from "./GameWorld";

export function createSkyHopperWorld(seed = Date.now(), highScoreProvider?: HighScoreProvider): GameWorld {
  const difficultyCurve = new LinearDifficultyCurve();
  let world: GameWorld;
  const spawnDirector = new SkyHopperSpawnDirector(
    new SeededRandom(seed),
    () => difficultyCurve.getSpeed(world?.getSnapshot().elapsedSeconds ?? 0)
  );
  world = new GameWorld(difficultyCurve, new AxisAlignedCollisionService(), spawnDirector, highScoreProvider);

  return world;
}
