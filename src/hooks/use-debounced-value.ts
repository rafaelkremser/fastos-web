import { useEffect, useState } from 'react'

// The value, once it stops changing for a moment. Searching as the user types
// would otherwise call the API on every key
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay)

    return () => clearTimeout(timeout)
  }, [value, delay])

  return debouncedValue
}
