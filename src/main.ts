import Phaser from "phaser";
import { GameScene } from "./game/scenes/GameScene";
import "./styles/app.css";

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  backgroundColor: "#7ec8f7",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 540
  },
  scene: [GameScene],
  render: {
    antialias: true,
    pixelArt: false
  }
};

new Phaser.Game(gameConfig);
