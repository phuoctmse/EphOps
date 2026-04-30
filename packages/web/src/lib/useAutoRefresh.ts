import { useEffect, useRef } from 'react'

/**
 * Calls `onRefresh` every `intervalMs` milliseconds as long as `active` is true.
 * Stops automatically when `active` becomes false.
 *
 * Useful for polling environments that are in a transient state (CREATING).
 */
export function useAutoRefresh(
  onRefresh: () => void,
  active: boolean,
  intervalMs = 5_000,
) {
  const callbackRef = useRef(onRefresh)
  callbackRef.current = onRefresh

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => callbackRef.current(), intervalMs)
    return () => clearInterval(id)
  }, [active, intervalMs])
}
