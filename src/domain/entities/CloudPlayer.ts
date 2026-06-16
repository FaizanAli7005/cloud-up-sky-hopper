import { GAME_BALANCE } from "../balance";
import { Bounds, GameInput, SimulatedEntity } from "../types";

export class CloudPlayer implements SimulatedEntity {
  readonly id = "player";
  readonly kind = "player";

  private x: number = GAME_BALANCE.playerStartX;
  private y: number = GAME_BALANCE.playerStartY;
  private velocityY = 0;

  updateWithInput(deltaSeconds: number, input: GameInput): void {
    const direction = Number(input.rightHeld) - Number(input.leftHeld);
    this.x += direction * GAME_BALANCE.playerHorizontalSpeed * deltaSeconds;

    const accelerationY = GAME_BALANCE.gravity + (input.boostHeld ? GAME_BALANCE.boostAcceleration : 0);
    this.velocityY += accelerationY * deltaSeconds;
    this.velocityY = Math.max(
      GAME_BALANCE.maxRiseVelocity,
      Math.min(GAME_BALANCE.maxFallVelocity, this.velocityY)
    );
    this.y += this.velocityY * deltaSeconds;

    this.x = Math.max(28, Math.min(GAME_BALANCE.worldWidth - GAME_BALANCE.playerWidth - 28, this.x));
    if (this.y < GAME_BALANCE.skyTop) {
      this.y = GAME_BALANCE.skyTop;
      this.velocityY = 0;
    }
  }

  update(deltaSeconds: number): void {
    this.updateWithInput(deltaSeconds, { leftHeld: false, rightHeld: false, boostHeld: false });
  }

  hasFallenBelowSky(): boolean {
    return this.y + this.getBounds().height > GAME_BALANCE.skyBottom;
  }

  getVelocityY(): number {
    return this.velocityY;
  }

  getBounds(): Bounds {
    return {
      x: this.x,
      y: this.y,
      width: GAME_BALANCE.playerWidth,
      height: GAME_BALANCE.playerHeight
    };
  }
}
