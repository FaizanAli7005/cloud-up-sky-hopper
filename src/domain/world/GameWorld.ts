import { GAME_BALANCE } from "../balance";
import { DifficultyCurve } from "../difficulty/DifficultyCurve";
import { CloudPlayer } from "../entities/CloudPlayer";
import { Collectible } from "../entities/Collectible";
import { MovingHazard } from "../entities/MovingHazard";
import { CollisionService } from "../physics/CollisionService";
import { HighScoreProvider, ScoreKeeper } from "../scoring/ScoreKeeper";
import { SpawnDirector } from "../spawn/SpawnDirector";
import { GameInput, GameSnapshot } from "../types";

export class GameWorld {
  private readonly player = new CloudPlayer();
  private readonly scoreKeeper: ScoreKeeper;
  private hazards: MovingHazard[] = [];
  private collectibles: Collectible[] = [];
  private elapsedSeconds = 0;
  private gameOver = false;

  constructor(
    private readonly difficultyCurve: DifficultyCurve,
    private readonly collisionService: CollisionService,
    private readonly spawnDirector: SpawnDirector,
    highScoreProvider?: HighScoreProvider
  ) {
    this.scoreKeeper = new ScoreKeeper(highScoreProvider);
  }

  update(deltaSeconds: number, input: GameInput): GameSnapshot {
    if (this.gameOver) {
      return this.getSnapshot();
    }

    this.elapsedSeconds += deltaSeconds;
    this.player.updateWithInput(deltaSeconds, input);
    this.scoreKeeper.update(deltaSeconds);

    const spawned = this.spawnDirector.update(deltaSeconds, this.elapsedSeconds);
    this.hazards.push(...spawned.filter((entity): entity is MovingHazard => entity instanceof MovingHazard));
    this.collectibles.push(...spawned.filter((entity): entity is Collectible => entity instanceof Collectible));

    this.hazards.forEach((entity) => entity.update(deltaSeconds));
    this.collectibles.forEach((entity) => entity.update(deltaSeconds));
    this.resolveCollisions();
    this.removeOffscreenEntities();

    if (this.player.hasFallenBelowSky()) {
      this.gameOver = true;
      this.scoreKeeper.resetCombo();
    }

    return this.getSnapshot();
  }

  getSnapshot(): GameSnapshot {
    const playerBounds = this.player.getBounds();

    return {
      player: {
        ...playerBounds,
        velocityY: this.player.getVelocityY()
      },
      obstacles: this.hazards.map((hazard) => ({
        ...hazard.getBounds(),
        id: hazard.id,
        type: hazard.obstacleType
      })),
      collectibles: this.collectibles.map((collectible) => ({
        ...collectible.getBounds(),
        id: collectible.id,
        type: collectible.collectibleType
      })),
      score: this.scoreKeeper.score,
      highScore: this.scoreKeeper.highScore,
      bestCombo: this.scoreKeeper.bestCombo,
      speed: this.difficultyCurve.getSpeed(this.elapsedSeconds),
      elapsedSeconds: this.elapsedSeconds,
      isGameOver: this.gameOver
    };
  }

  private resolveCollisions(): void {
    const playerBounds = this.player.getBounds();

    if (this.hazards.some((hazard) => this.collisionService.overlaps(playerBounds, hazard.getBounds()))) {
      this.gameOver = true;
      this.scoreKeeper.resetCombo();
      return;
    }

    this.collectibles = this.collectibles.filter((collectible) => {
      if (this.collisionService.overlaps(playerBounds, collectible.getBounds())) {
        if (collectible.collectibleType === "boost") {
          this.scoreKeeper.addBoostBonus();
        } else {
          this.scoreKeeper.addStar();
        }
        return false;
      }

      return true;
    });
  }

  private removeOffscreenEntities(): void {
    this.hazards = this.hazards.filter((entity) => entity.getBounds().y < GAME_BALANCE.despawnY);
    this.collectibles = this.collectibles.filter((entity) => entity.getBounds().y < GAME_BALANCE.despawnY);
  }
}
