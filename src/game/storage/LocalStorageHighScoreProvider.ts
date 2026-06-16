import { HighScoreProvider } from "../../domain/scoring/ScoreKeeper";

const HIGH_SCORE_KEY = "cloud-up-sky-hopper.high-score";

export class LocalStorageHighScoreProvider implements HighScoreProvider {
  load(): number {
    const value = window.localStorage.getItem(HIGH_SCORE_KEY);
    return value ? Number(value) || 0 : 0;
  }

  save(score: number): void {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(Math.max(this.load(), score)));
  }
}
