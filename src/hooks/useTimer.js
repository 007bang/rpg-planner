import { useState, useRef, useCallback, useEffect } from 'react'

export function useTimer() {
  const [elapsed, setElapsed]   = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef(null)

  const start = useCallback(() => {
    if (intervalRef.current) return
    setIsRunning(true)
    intervalRef.current = setInterval(() => setElapsed(p => p + 1), 1000)
  }, [])

  const pause = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    setIsRunning(false)
    setElapsed(0)
  }, [])

  useEffect(() => () => clearInterval(intervalRef.current), [])

  return { elapsed, isRunning, start, pause, reset }
}
