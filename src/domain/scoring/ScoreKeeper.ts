import { GAME_BALANCE } from "../balance";

export class ScoreKeeper {
  private currentScore = 0;
  private combo = 0;
  private highestCombo = 0;

  constructor(private readonly highScoreProvider: HighScoreProvider = new MemoryHighScoreProvider()) {}

  update(deltaSeconds: number): void {
    this.currentScore += GAME_BALANCE.scorePerSecond * deltaSeconds * (1 + this.combo * 0.04);
  }

  addStar(): void {
    this.combo += 1;
    this.highestCombo = Math.max(this.highestCombo, this.combo);
    this.currentScore += GAME_BALANCE.starBonus * this.combo;
  }

  addBoostBonus(): void {
    this.combo += 2;
    this.highestCombo = Math.max(this.highestCombo, this.combo);
    this.currentScore += GAME_BALANCE.boostBonus + GAME_BALANCE.starBonus * this.combo;
  }

  resetCombo(): void {
    this.combo = 0;
    this.highScoreProvider.save(Math.max(this.highScoreProvider.load(), this.score));
  }

  get score(): number {
    return Math.floor(this.currentScore);
  }

  get bestCombo(): number {
    return this.highestCombo;
  }

  get highScore(): number {
    return Math.max(this.highScoreProvider.load(), this.score);
  }
}

export interface HighScoreProvider {
  load(): number;
  save(score: number): void;
}

export class MemoryHighScoreProvider implements HighScoreProvider {
  private highScore = 0;

  load(): number {
    return this.highScore;
  }

  save(score: number): void {
    this.highScore = Math.max(this.highScore, score);
  }
}
