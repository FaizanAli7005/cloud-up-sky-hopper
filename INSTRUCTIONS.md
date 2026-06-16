# Cloud Up: Sky Hopper - Run Instructions

Follow these steps after extracting `cloud-up-sky-hopper.zip`.

## Requirements

- Node.js 20 or newer.
- A modern browser such as Chrome, Edge, or Firefox.
- Internet access for the first `npm install`, because dependencies are downloaded from npm.

## Run The Game

1. Extract the zip into a folder, for example:

```text
Desktop/cloud-up-sky-hopper
```

2. Open a terminal in that extracted folder.

3. Install dependencies:

```bash
npm install
```

4. Start the local game server:

```bash
npm run dev -- --port 5173
```

5. Open the game in your browser:

```text
http://127.0.0.1:5173/
```

## If Port 5173 Is Busy

Run the server on another port:

```bash
npm run dev -- --port 5174
```

Then open:

```text
http://127.0.0.1:5174/
```

## Controls

- Start: click `START` or press `Space`, `Up`, `W`, `A`, `D`, `Left`, or `Right`.
- Rise: hold `Space`, `Up`, `W`, or hold/click/touch the game.
- Move: `Left` / `Right` arrow keys or `A` / `D`.
- Pause/resume: `P`.
- Help menu: `H` or the `HELP` button.
- Restart: `R` or the `RESTART` button after game over.

## Objective

Keep the cloud airborne, avoid all hazards, and do not touch the storm floor at the bottom of the screen.

## Hazards

- Bird
- Storm cloud
- Balloon
- Storm floor

## Scoring Tips

- Survive longer to earn altitude score.
- Collect stars for timed combo score.
- Collect teal boost gems for bigger bonus chains.
- Avoid risky collectibles when hazards are close.
- Stay around the upper-middle of the sky so you have room to recover.

## Developer Commands

Run production build:

```bash
npm run build
```

Run deterministic backtests:

```bash
npm run backtest
```

Check dependencies for known vulnerabilities:

```bash
npm audit
```
