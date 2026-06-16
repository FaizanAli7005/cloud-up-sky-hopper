import Phaser from "phaser";
import { CollectibleSnapshot, GameSnapshot, ObstacleSnapshot } from "../../domain/types";
import { GameWorld } from "../../domain/world/GameWorld";
import { createSkyHopperWorld } from "../../domain/world/createSkyHopperWorld";
import { SkyAudio } from "../audio/SkyAudio";
import { LocalStorageHighScoreProvider } from "../storage/LocalStorageHighScoreProvider";

type SpriteMap = Map<string, Phaser.GameObjects.Container>;
type RunState = "ready" | "playing" | "paused" | "help" | "gameOver";

export class GameScene extends Phaser.Scene {
  private world!: GameWorld;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private obstacleSprites: SpriteMap = new Map();
  private starSprites: SpriteMap = new Map();
  private backgroundClouds: Phaser.GameObjects.Container[] = [];
  private audio = new SkyAudio();
  private player!: Phaser.GameObjects.Container;
  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Container;
  private overlayTitle!: Phaser.GameObjects.Text;
  private overlayAction!: Phaser.GameObjects.Text;
  private overlayHelpText!: Phaser.GameObjects.Text;
  private helpButton!: Phaser.GameObjects.Text;
  private previousRunState: RunState = "ready";
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private pointerBoostHeld = false;
  private runState: RunState = "ready";
  private lastScore = 0;

  constructor() {
    super("game");
  }

  create(): void {
    this.startRun();
    this.createBackdrop();
    this.createPlayer();
    this.createHud();
    this.createOverlay();
    this.bindControls();
    this.renderSnapshot(this.world.getSnapshot());
    this.syncOverlay();
  }

  update(_time: number, deltaMs: number): void {
    if (this.runState === "paused") {
      this.statusText.setText("PAUSED");
      this.syncOverlay();
      return;
    }

    if (this.runState === "ready" || this.runState === "help" || this.runState === "gameOver") {
      this.syncOverlay();
      return;
    }

    const deltaSeconds = Math.min(deltaMs / 1000, 1 / 30);
    const snapshot = this.world.update(deltaSeconds, {
      leftHeld: Boolean(this.cursors.left?.isDown) || this.keyA.isDown,
      rightHeld: Boolean(this.cursors.right?.isDown) || this.keyD.isDown,
      boostHeld:
        this.pointerBoostHeld ||
        Boolean(this.cursors.up?.isDown) ||
        this.keySpace.isDown ||
        this.keyW.isDown
    });

    this.animateBackdrop(deltaSeconds, snapshot.speed);
    this.renderSnapshot(snapshot);

    if (snapshot.isGameOver) {
      this.runState = "gameOver";
    }
    this.syncOverlay();
  }

  private startRun(): void {
    this.world = createSkyHopperWorld(Date.now(), new LocalStorageHighScoreProvider());
    this.lastScore = 0;
  }

  private bindControls(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyA = this.input.keyboard!.addKey("A");
    this.keyD = this.input.keyboard!.addKey("D");
    this.keyW = this.input.keyboard!.addKey("W");
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.input.keyboard!.on("keydown-P", () => {
      if (this.runState === "help") {
        return;
      }
      if (this.runState === "playing") {
        this.runState = "paused";
      } else if (this.runState === "paused") {
        this.runState = "playing";
      }
    });

    this.input.keyboard!.on("keydown-R", () => {
      this.resetRun();
    });

    this.input.keyboard!.on("keydown-H", () => {
      this.toggleHelp();
    });

    this.input.keyboard!.on("keydown", (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW"].includes(event.code)) {
        this.startPlaying();
      }
    });

    this.input.on("pointerdown", () => {
      this.pointerBoostHeld = true;
      this.startPlaying();
    });

    this.input.on("pointerup", () => {
      this.pointerBoostHeld = false;
    });

    this.input.on("pointerout", () => {
      this.pointerBoostHeld = false;
    });
  }

  private resetRun(): void {
    this.startRun();
    this.runState = "ready";
    this.clearSprites(this.obstacleSprites);
    this.clearSprites(this.starSprites);
    this.statusText.setText("CLOUD UP");
    this.renderSnapshot(this.world.getSnapshot());
    this.syncOverlay();
  }

  private startPlaying(): void {
    if (this.runState === "ready") {
      this.runState = "playing";
      this.audio.start();
      this.audio.playStart();
    }
  }

  private createBackdrop(): void {
    this.add.rectangle(480, 270, 960, 540, 0x99d8ff);
    this.add.rectangle(480, 134, 960, 268, 0xc7ecff).setAlpha(0.64);
    this.add.rectangle(480, 456, 960, 168, 0x8dc8f8).setAlpha(0.42);
    this.add.circle(790, 86, 54, 0xfff0a8).setAlpha(0.96);

    for (const cloud of [
      { x: 122, y: 96, s: 0.8, a: 0.66 },
      { x: 360, y: 148, s: 1.1, a: 0.72 },
      { x: 650, y: 82, s: 0.7, a: 0.62 },
      { x: 850, y: 172, s: 1.0, a: 0.68 },
      { x: 210, y: 382, s: 1.3, a: 0.46 },
      { x: 740, y: 438, s: 1.05, a: 0.5 }
    ]) {
      this.backgroundClouds.push(this.drawCloud(cloud.x, cloud.y, cloud.s, 0xffffff, cloud.a));
    }

    this.add.rectangle(480, 500, 960, 80, 0x2a4f78).setAlpha(0.76);
    this.add.rectangle(480, 486, 960, 12, 0xffd166).setAlpha(0.9);
    this.add.text(480, 514, "STORM FLOOR - DO NOT FALL", {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "18px",
      fontStyle: "800",
      color: "#ffffff"
    }).setOrigin(0.5);
    for (const x of [80, 220, 360, 500, 640, 780, 920]) {
      this.add.triangle(x, 530, -18, 14, 18, 14, 0, -24, 0xffd54f).setAlpha(0.72);
    }
  }

  private createPlayer(): void {
    this.player = this.add.container(0, 0);
    this.player.add(this.add.rectangle(0, -28, 58, 6, 0x415c72));
    this.player.add(this.add.rectangle(0, -28, 6, 20, 0x415c72));
    this.player.add(this.add.ellipse(0, -30, 74, 10, 0xdfe8ef).setAlpha(0.86));
    this.player.add(this.add.ellipse(0, 20, 74, 38, 0xffffff));
    this.player.add(this.add.ellipse(-25, 9, 40, 34, 0xffffff));
    this.player.add(this.add.ellipse(5, 3, 50, 44, 0xffffff));
    this.player.add(this.add.ellipse(32, 13, 34, 30, 0xffffff));
    this.player.add(this.add.circle(-12, 9, 4, 0x18334d));
    this.player.add(this.add.circle(16, 9, 4, 0x18334d));
    this.player.add(this.add.arc(2, 18, 12, 0, 180, false, 0x18334d));
  }

  private createHud(): void {
    const textStyle = {
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#102033"
    };

    this.scoreText = this.add.text(28, 24, "Score 0", {
      ...textStyle,
      fontSize: "24px",
      fontStyle: "700"
    });
    this.highScoreText = this.add.text(28, 58, "Best 0", {
      ...textStyle,
      fontSize: "16px",
      color: "#29465e"
    });
    this.speedText = this.add.text(28, 82, "Altitude 0m", {
      ...textStyle,
      fontSize: "16px",
      color: "#29465e"
    });
    this.statusText = this.add
      .text(480, 44, "CLOUD UP", {
        ...textStyle,
        fontSize: "22px",
        fontStyle: "800",
        align: "center"
      })
      .setOrigin(0.5);
    this.helpButton = this.add
      .text(858, 24, "HELP", {
        ...textStyle,
        fontSize: "16px",
        fontStyle: "800",
        color: "#ffffff",
        backgroundColor: "#28658a",
        padding: { left: 14, right: 14, top: 8, bottom: 8 }
      })
      .setInteractive({ useHandCursor: true });
    this.helpButton.on("pointerdown", () => {
      this.toggleHelp();
    });
  }

  private createOverlay(): void {
    this.overlay = this.add.container(480, 270);
    this.overlay.add(this.add.rectangle(0, 0, 520, 340, 0xf7fbff, 0.94).setStrokeStyle(1, 0x86bdd8, 0.8));
    this.overlayTitle = this.add
      .text(0, -118, "CLOUD UP", {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "28px",
        fontStyle: "800",
        color: "#102033",
        align: "center"
      })
      .setOrigin(0.5);
    this.overlayHelpText = this.add
      .text(0, -46, "", {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "16px",
        color: "#20384d",
        align: "center",
        wordWrap: { width: 440, useAdvancedWrap: true }
      })
      .setOrigin(0.5);
    this.overlayAction = this.add
      .text(0, 114, "START", {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "18px",
        fontStyle: "700",
        color: "#ffffff",
        backgroundColor: "#28658a",
        padding: { left: 24, right: 24, top: 10, bottom: 10 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.overlayAction.on("pointerdown", () => {
      if (this.runState === "help") {
        this.runState = this.previousRunState === "help" ? "ready" : this.previousRunState;
        this.syncOverlay();
        return;
      }
      if (this.runState === "gameOver") {
        this.resetRun();
      }
      if (this.runState === "paused") {
        this.runState = "playing";
        return;
      }
      this.startPlaying();
    });
    this.overlay.add([this.overlayTitle, this.overlayHelpText, this.overlayAction]);
  }

  private syncOverlay(): void {
    if (this.runState === "playing") {
      this.overlay.setVisible(false);
      return;
    }

    this.overlay.setVisible(true);
    this.overlayHelpText.setVisible(false);
    if (this.runState === "paused") {
      this.overlayTitle.setText("PAUSED");
      this.overlayAction.setText("RESUME");
      return;
    }

    if (this.runState === "gameOver") {
      this.overlayTitle.setText("GAME OVER");
      this.overlayAction.setText("RESTART");
      return;
    }

    if (this.runState === "help") {
      this.overlayTitle.setText("HOW TO PLAY");
      this.overlayHelpText.setVisible(true);
      this.overlayHelpText.setText(
        "Goal: keep the propeller cloud airborne and survive as long as possible.\n\nControls: Hold Up, W, Space, or touch to rise. Use Left/Right or A/D to steer. Press P to pause, R to restart, H for help.\n\nAvoid: birds, thunderclouds, windmills, balloons, and the storm floor.\n\nScore: survive for altitude points, collect stars for combo points, and grab teal boost gems for bigger bonus chains."
      );
      this.overlayAction.setText("CLOSE");
      return;
    }

    this.overlayTitle.setText("CLOUD UP");
    this.overlayHelpText.setVisible(true);
    this.overlayHelpText.setText("Stay above the storm floor, dodge sky hazards, and collect stars.");
    this.overlayAction.setText("START");
  }

  private toggleHelp(): void {
    if (this.runState === "help") {
      this.runState = this.previousRunState === "help" ? "ready" : this.previousRunState;
    } else {
      this.previousRunState = this.runState;
      this.runState = "help";
    }
    this.syncOverlay();
  }

  private renderSnapshot(snapshot: GameSnapshot): void {
    this.player.setPosition(snapshot.player.x + snapshot.player.width / 2, snapshot.player.y + snapshot.player.height / 2);
    this.player.setRotation(Phaser.Math.Clamp(snapshot.player.velocityY / 1400, -0.18, 0.22));

    this.syncHazards(snapshot);
    this.syncStars(snapshot);

    if (snapshot.score > this.lastScore + 80) {
      this.audio.playCollect(snapshot.score - this.lastScore > 220);
    }
    this.lastScore = snapshot.score;

    this.scoreText.setText(`Score ${snapshot.score}`);
    this.highScoreText.setText(`Best ${snapshot.highScore}`);
    this.speedText.setText(`Altitude ${Math.round(snapshot.elapsedSeconds * 10)}m`);
    this.statusText.setText(snapshot.isGameOver ? "GAME OVER" : "CLOUD UP");
    if (snapshot.isGameOver && this.runState !== "gameOver") {
      this.audio.playCrash();
    }
  }

  private syncHazards(snapshot: GameSnapshot): void {
    const visibleIds = new Set<string>();

    snapshot.obstacles.forEach((obstacle) => {
      visibleIds.add(obstacle.id);

      let sprite = this.obstacleSprites.get(obstacle.id);
      if (!sprite) {
        sprite = this.createObstacleSprite(obstacle);
        this.obstacleSprites.set(obstacle.id, sprite);
      }

      sprite.setPosition(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
      sprite.setScale(obstacle.width / 70, obstacle.height / 68);
    });

    this.removeHiddenSprites(this.obstacleSprites, visibleIds);
  }

  private syncStars(snapshot: GameSnapshot): void {
    const visibleIds = new Set<string>();

    snapshot.collectibles.forEach((collectible) => {
      visibleIds.add(collectible.id);

      let sprite = this.starSprites.get(collectible.id);
      if (!sprite) {
        sprite = this.createCollectibleSprite(collectible);
        this.starSprites.set(collectible.id, sprite);
      }

      sprite.setPosition(collectible.x + collectible.width / 2, collectible.y + collectible.height / 2);
      sprite.setAngle(this.time.now / 20);
    });

    this.removeHiddenSprites(this.starSprites, visibleIds);
  }

  private removeHiddenSprites(sprites: SpriteMap, visibleIds: Set<string>): void {
    for (const [id, sprite] of sprites) {
      if (!visibleIds.has(id)) {
        sprite.destroy();
        sprites.delete(id);
      }
    }
  }

  private clearSprites(sprites: SpriteMap): void {
    for (const sprite of sprites.values()) {
      sprite.destroy();
    }
    sprites.clear();
  }

  private createObstacleSprite(obstacle: ObstacleSnapshot): Phaser.GameObjects.Container {
    switch (obstacle.type) {
      case "bird":
        return this.createBirdSprite();
      case "windmill":
        return this.createWindmillSprite();
      case "balloon":
        return this.createBalloonSprite();
      case "storm":
      default:
        return this.createStormSprite();
    }
  }

  private createBirdSprite(): Phaser.GameObjects.Container {
    const sprite = this.add.container(0, 0);
    sprite.add(this.add.ellipse(0, 2, 44, 24, 0x26384f).setStrokeStyle(2, 0xfff2a6));
    sprite.add(this.add.triangle(-18, 0, -18, 0, -52, -22, -38, 14, 0x55708c));
    sprite.add(this.add.triangle(18, 0, 18, 0, 52, -22, 38, 14, 0x55708c));
    sprite.add(this.add.triangle(28, -2, 28, -8, 46, -2, 28, 5, 0xffd166));
    sprite.add(this.add.circle(18, -4, 4, 0xf7fbff));
    sprite.add(this.add.text(0, 28, "BIRD", { fontSize: "11px", color: "#102033", fontStyle: "800" }).setOrigin(0.5));
    return sprite;
  }

  private createStormSprite(): Phaser.GameObjects.Container {
    const sprite = this.add.container(0, 0);
    sprite.add(this.add.ellipse(-8, -8, 56, 38, 0x26384f).setStrokeStyle(2, 0xffd166));
    sprite.add(this.add.ellipse(16, -2, 48, 36, 0x5c6f8c));
    sprite.add(this.add.rectangle(0, 15, 66, 24, 0x35485f));
    sprite.add(this.add.triangle(0, 42, -12, 4, 11, 4, -4, 44, 0xffd54f));
    sprite.add(this.add.text(0, 32, "STORM", { fontSize: "11px", color: "#102033", fontStyle: "800" }).setOrigin(0.5));
    return sprite;
  }

  private createWindmillSprite(): Phaser.GameObjects.Container {
    const sprite = this.add.container(0, 0);
    sprite.add(this.add.rectangle(0, 22, 12, 58, 0x8e725e).setStrokeStyle(2, 0x533f35));
    sprite.add(this.add.circle(0, -8, 9, 0x31566b));
    sprite.add(this.add.triangle(0, -8, 0, -8, -48, -20, -12, 0, 0xf7fbff).setStrokeStyle(1, 0x31566b));
    sprite.add(this.add.triangle(0, -8, 0, -8, 48, -20, 12, 0, 0xf7fbff).setStrokeStyle(1, 0x31566b));
    sprite.add(this.add.triangle(0, -8, 0, -8, -10, 38, 10, 8, 0xf7fbff).setStrokeStyle(1, 0x31566b));
    sprite.add(this.add.text(0, 58, "WINDMILL", { fontSize: "10px", color: "#102033", fontStyle: "800" }).setOrigin(0.5));
    return sprite;
  }

  private createBalloonSprite(): Phaser.GameObjects.Container {
    const sprite = this.add.container(0, 0);
    sprite.add(this.add.ellipse(0, -12, 48, 60, 0xff6b6b).setStrokeStyle(2, 0x9d3d3d));
    sprite.add(this.add.line(0, -18, 0, -38, 0, 14, 0xffffff).setLineWidth(2).setAlpha(0.5));
    sprite.add(this.add.line(0, 16, -12, 0, -4, 36, 0x3a5368).setLineWidth(2));
    sprite.add(this.add.line(0, 16, 12, 0, 4, 36, 0x3a5368).setLineWidth(2));
    sprite.add(this.add.rectangle(0, 36, 20, 14, 0xb98b4f).setStrokeStyle(1, 0x6d4a2d));
    sprite.add(this.add.text(0, 56, "BALLOON", { fontSize: "10px", color: "#102033", fontStyle: "800" }).setOrigin(0.5));
    return sprite;
  }

  private createCollectibleSprite(collectible: CollectibleSnapshot): Phaser.GameObjects.Container {
    return collectible.type === "boost" ? this.createBoostSprite() : this.createStarSprite();
  }

  private createStarSprite(): Phaser.GameObjects.Container {
    const sprite = this.add.container(0, 0);
    const points = [
      0, -18, 5, -6, 18, -6, 8, 2, 12, 16, 0, 8, -12, 16, -8, 2, -18, -6, -5, -6
    ];
    sprite.add(this.add.polygon(0, 0, points, 0xffd166));
    sprite.add(this.add.polygon(0, 0, points, 0xfff2a6).setScale(0.58));
    return sprite;
  }

  private createBoostSprite(): Phaser.GameObjects.Container {
    const sprite = this.add.container(0, 0);
    sprite.add(this.add.circle(0, 0, 19, 0x75f0d0));
    sprite.add(this.add.circle(0, 0, 11, 0xeafffb));
    sprite.add(this.add.triangle(0, 2, -6, -10, 10, 0, -4, 12, 0x2f9cbe));
    return sprite;
  }

  private drawCloud(x: number, y: number, scale: number, color: number, alpha: number): Phaser.GameObjects.Container {
    const cloud = this.add.container(x, y).setScale(scale).setAlpha(alpha);
    cloud.add(this.add.ellipse(-34, 14, 70, 36, color));
    cloud.add(this.add.ellipse(8, 4, 78, 48, color));
    cloud.add(this.add.ellipse(54, 15, 62, 34, color));
    return cloud;
  }

  private animateBackdrop(deltaSeconds: number, speed: number): void {
    for (const cloud of this.backgroundClouds) {
      cloud.y += deltaSeconds * speed * 0.16 * cloud.scale;
      if (cloud.y > 610) {
        cloud.y = -80;
      }
    }
  }
}
