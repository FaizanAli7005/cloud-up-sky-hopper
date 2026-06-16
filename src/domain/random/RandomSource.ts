export interface RandomSource {
  next(): number;
  between(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}
