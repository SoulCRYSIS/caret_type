import { useEffect, useState } from 'react'
import { dayKey } from './streak'

/** Local day key that rolls over at midnight. */
export function useToday(): string {
  const [today, setToday] = useState(() => dayKey())
  useEffect(() => {
    const id = setInterval(() => setToday(dayKey()), 60_000)
    return () => clearInterval(id)
  }, [])
  return today
}
