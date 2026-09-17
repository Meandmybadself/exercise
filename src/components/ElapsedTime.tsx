import { useEffect, useState } from 'react'
import { formatClock, workoutDurationMs } from '../lib/duration'
import type { Workout } from '../lib/types'

/**
 * Elapsed milliseconds for a workout, re-rendering once a second while it runs
 * and holding still once it's finished. The value is recomputed from the clock
 * rather than counted up, so it stays right after the tab has been backgrounded.
 */
export function useElapsed(workout: Workout): number | undefined {
  const running = !workout.finishedAt
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!running) return
    const bump = () => setTick((t) => t + 1)
    const interval = setInterval(bump, 1000)
    // Background tabs throttle timers, so resync the moment we're visible again.
    document.addEventListener('visibilitychange', bump)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', bump)
    }
  }, [running])

  return workoutDurationMs(workout)
}

/** Running clock for a workout, frozen at its final time once finished. */
export function ElapsedTime({ workout, className }: { workout: Workout; className?: string }) {
  const ms = useElapsed(workout)
  if (ms === undefined) return null
  return <span className={className}>{formatClock(ms)}</span>
}
