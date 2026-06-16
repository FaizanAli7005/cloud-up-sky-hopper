export class SkyAudio {
  private context?: AudioContext;
  private ambient?: OscillatorNode;

  start(): void {
    const context = this.getContext();
    if (context.state === "suspended") {
      void context.resume();
    }

    if (this.ambient) {
      return;
    }

    const gain = context.createGain();
    gain.gain.value = 0.018;
    this.ambient = context.createOscillator();
    this.ambient.type = "sine";
    this.ambient.frequency.value = 174;
    this.ambient.connect(gain);
    gain.connect(context.destination);
    this.ambient.start();
  }

  playStart(): void {
    this.playTone(420, 0.1, 0.05);
  }

  playCollect(isBonus: boolean): void {
    this.playTone(isBonus ? 760 : 560, 0.08, isBonus ? 0.07 : 0.045);
  }

  playCrash(): void {
    this.playTone(110, 0.22, 0.09);
  }

  private playTone(frequency: number, durationSeconds: number, volume: number): void {
    const context = this.getContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + durationSeconds);
    oscillator.stop(context.currentTime + durationSeconds);
  }

  private getContext(): AudioContext {
    this.context ??= new AudioContext();
    return this.context;
  }
}
