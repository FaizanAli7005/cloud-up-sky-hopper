import { RandomSource } from "./RandomSource";

export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  between(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("Cannot pick from an empty collection.");
    }

    return items[Math.floor(this.next() * items.length)];
  }
}
