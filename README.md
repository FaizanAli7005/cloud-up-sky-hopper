# Cloud Up: Sky Hopper

Cloud Up is a 2D endless vertical arcade game based on the Sky Hopper proposal. The player controls a propeller cloud rising through an endless sky, dodging birds, thunderstorms, and balloons while collecting stars and boost bonuses.

## Tech Stack

- Phaser 3 for the game scene, rendering, input, and animation.
- TypeScript for strict OOP contracts and compile-time checks.
- Vite for local development and production builds.
- Vitest for deterministic simulation backtests.

## Architecture

- `src/domain` contains engine-independent game rules: player physics, obstacle and collectible entities, collision detection, scoring, difficulty, seeded randomness, and procedural spawning.
- `src/game` contains Phaser-specific presentation: scene rendering, browser storage, input, UI states, and procedural audio.
- Domain dependencies are injected through interfaces such as `DifficultyCurve`, `CollisionService`, `RandomSource`, `SpawnDirector`, and `HighScoreProvider`, keeping the code aligned with SOLID principles.

## Game Features

- Endless vertical sky gameplay.
- Cloud character with propeller hover controls.
- Procedural obstacle generation.
- Visible storm floor: falling into it ends the run.
- Collectible stars and boost bonuses.
- Dynamic difficulty progression.
- Score and high-score persistence.
- Start, help, pause, game-over, restart flow.
- Procedural sound effects and ambient audio.

## Controls

- Start: click `START`, press `Up`, `W`, `Space`, `Left`, `Right`, `A`, or `D`.
- Rise: hold `Up`, `W`, `Space`, or hold/click/touch the game.
- Move left/right: `Left` / `Right` arrow keys or `A` / `D`.
- Pause/resume: `P`.
- Restart: `R`, or click `RESTART` after game over.
- Help: click `HELP` or press `H`.

## How To Maximize Score

- Stay alive as long as possible to keep earning altitude score.
- Collect stars to build timed combo points.
- Grab teal boost gems when safe; they give a larger bonus and increase the combo faster.
- Do not chase collectibles through hazards. Survival is worth more than a risky star.
- Keep the cloud near the upper-middle of the sky so there is time to dodge falling hazards.
- Avoid the storm floor at the bottom. Touching it ends the game.

## Run After Extracting The Zip

1. Install Node.js 20 or newer from the official Node.js website if it is not already installed.
2. Extract `cloud-up-sky-hopper.zip` into a normal folder, for example `Desktop/cloud-up-sky-hopper`.
3. Open a terminal in the extracted folder.
4. Install dependencies:

```bash
npm install
```

5. Start the game:

```bash
npm run dev -- --port 5173
```

6. Open this URL in a browser:

```text
http://127.0.0.1:5173/
```

7. To make a production build:

```bash
npm run build
```

8. To run the deterministic backtests:

```bash
npm run backtest
```

If the terminal says the port is already in use, run the dev command with another port, for example:

```bash
npm run dev -- --port 5174
```

Then open `http://127.0.0.1:5174/`.

## Verification

```bash
npm run build
npm run backtest
npm audit
```

The backtest suite runs deterministic long-form simulations across multiple seeds, verifies failure when the player does nothing, checks collision and bonus behavior, checks the difficulty cap, and proves seeded randomness is reproducible.
