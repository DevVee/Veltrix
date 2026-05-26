import { useState, useEffect, useCallback } from 'react'

interface DataState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useData<T>(fetcher: () => Promise<T>, deps: unknown[] = []): DataState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then(d => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(e => { if (!cancelled) { setError(e instanceof Error ? e.message : 'Unknown error'); setLoading(false) } })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])

  return { data, loading, error, refetch }
}
