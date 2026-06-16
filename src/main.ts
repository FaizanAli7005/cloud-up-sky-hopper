import Phaser from "phaser";
import { GameScene } from "./game/scenes/GameScene";
import "./styles/app.css";

const renderScale = Math.min(window.devicePixelRatio || 1, 2);

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  backgroundColor: "#7ec8f7",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280 * renderScale,
    height: 540 * renderScale
  },
  zoom: renderScale,
  scene: [GameScene],
  render: {
    antialias: true,
    pixelArt: false
  }
};

new Phaser.Game(gameConfig);
