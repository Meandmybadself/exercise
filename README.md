# Exercise

A mobile-first workout trainer that lives entirely in your browser. Configure a library of
exercises, tap **Start workout**, and it picks a random set — weighted toward the ones you
haven't done in a while — then logs your weight and reps against history.

Live at [exercise.meandmybadself.com](https://exercise.meandmybadself.com).

## Features

- Exercise library with optional per-exercise seat setting
- Randomized workouts, biased toward least-recently-done exercises; configurable size
- Or build one by hand: pick the exercises up front, or add them one at a time mid-workout
- Live timer that starts with the workout and stops when you finish, with durations kept in history
- Swap or skip exercises mid-workout
- Shows your last weight/reps for each exercise and prefills them
- History log and per-exercise progression
- Import / export of all history and configuration as JSON
- Installable PWA; works offline
- No backend — all data is in `localStorage`

## Development

```sh
npm install
npm run dev      # local dev server
npm test         # unit tests (vitest)
npm run build    # production build to dist/
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Data format

Exports are a single JSON document:

```ts
{
  version: 1,
  settings: { exercisesPerWorkout: number },
  exercises: { id, name, seatSetting?, archived? }[],
  workouts: { id, startedAt, finishedAt?, entries: { exerciseId, weight?, reps?, status }[] }[]
}
```

Removing an exercise that has history archives it instead of deleting it, so past workouts
still resolve its name.
