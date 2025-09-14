# Playtest Instructions

This lightweight panel set lets you manually drive a hacking session loop for design validation.

## Boot

1. Install deps (first time): `npm install`
2. Start dev server: `npm run dev`
3. Open http://localhost:5173

## Panels

Mission Board:

- Lists procedurally generated missions auto‑hydrated at startup (see `main.tsx`).
- Select one to set it active (bolded) then click Start Session.
- Enter a numeric seed (or press Randomize) before starting for deterministic / reproducible sessions.

Active Session:

- Shows defenses, their progress, seed, and trace percentage.
- Auto Tick checkbox runs ticks on an interval (enabled by default). Uncheck to step only when actions queued (future manual tick control could be added).
- Auto Queue Next optionally queues attacks automatically against the next defense as soon as one is available.
- While session is active, you can still manually press Run Tool to queue a run.
- Session ends in success when all defenses reach bypassed state (payout awarded automatically by middleware on success tick).
- Elapsed time counter updates ~2x per second.
- When Auto Tick is off, a Tick button appears for manual stepping.
- Active Runs list shows in‑flight tool runs with % progress and ETA (seconds remaining).

Ledger:

- Displays current credits and most recent transactions (payout entries appear after successful session completion).

## Flow

1. Select mission.
2. (Optional) Adjust or randomize seed.
3. Start Session.
4. (Optional) Enable Auto Queue Next for hands‑off completion.
5. Observe ledger credit increase.

## Notes

- Current mission acceptance has no gating; future iterations will reference mission gates & profile state.
- Payout formula: avg(base range) _ defense count _ difficulty multiplier (see `sessionSlice.tickSession`).
- Trace mechanics are simplified; adaptive behaviors and noise events are placeholders.
- All imports use relative paths (aliases removed) for consistent Windows build behavior.

## Next Ideas

- Show time estimates per tool run and cumulative mission duration.
- Surface probability / RNG-driven events for debugging.
- Add manual tick step button when Auto Tick disabled.
