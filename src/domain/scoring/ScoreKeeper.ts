import { GAME_BALANCE } from "../balance";

export class ScoreKeeper {
  private currentScore = 0;
  private combo = 0;
  private highestCombo = 0;
  private comboTimeRemaining = 0;

  constructor(private readonly highScoreProvider: HighScoreProvider = new MemoryHighScoreProvider()) {}

  update(deltaSeconds: number): void {
    this.currentScore += GAME_BALANCE.scorePerSecond * deltaSeconds * (1 + this.combo * 0.04);
    if (this.combo === 0) {
      return;
    }

    this.comboTimeRemaining = Math.max(0, this.comboTimeRemaining - deltaSeconds);
    if (this.comboTimeRemaining === 0) {
      this.combo = 0;
    }
  }

  addStar(): void {
    this.combo += 1;
    this.refreshCombo();
    this.currentScore += GAME_BALANCE.starBonus * this.combo;
  }

  addBoostBonus(): void {
    this.combo += 2;
    this.refreshCombo();
    this.currentScore += GAME_BALANCE.boostBonus + GAME_BALANCE.starBonus * this.combo;
  }

  resetCombo(): void {
    this.combo = 0;
    this.comboTimeRemaining = 0;
    this.highScoreProvider.save(Math.max(this.highScoreProvider.load(), this.score));
  }

  get score(): number {
    return Math.floor(this.currentScore);
  }

  get bestCombo(): number {
    return this.highestCombo;
  }

  get currentCombo(): number {
    return this.combo;
  }

  get bonusTimeRemaining(): number {
    return this.comboTimeRemaining;
  }

  get highScore(): number {
    return Math.max(this.highScoreProvider.load(), this.score);
  }

  private refreshCombo(): void {
    this.highestCombo = Math.max(this.highestCombo, this.combo);
    this.comboTimeRemaining = GAME_BALANCE.bonusComboWindowSeconds;
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
