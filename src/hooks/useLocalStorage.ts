import { useState, useEffect } from 'react'

/**
 * Custom hook for managing localStorage with TypeScript support
 * @param key - The localStorage key
 * @param initialValue - The initial value to use if nothing is in localStorage
 * @returns [storedValue, setValue] - Similar to useState but synced with localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key)
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Debug log for cart updates
      if (key === 'sikupi:cart') {
        console.log('💾 [LOCALSTORAGE] Setting cart:', { key, old: storedValue, new: valueToStore })
      }
      
      // Only update if value has actually changed
      if (JSON.stringify(valueToStore) === JSON.stringify(storedValue)) {
        if (key === 'sikupi:cart') {
          console.log('💾 [LOCALSTORAGE] No change, skipping update')
        }
        return
      }
      
      // Save state
      setStoredValue(valueToStore)
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
        if (key === 'sikupi:cart') {
          console.log('💾 [LOCALSTORAGE] Saved to localStorage successfully')
        }
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}

/**
 * Hook for managing localStorage with server-side rendering support
 * Returns null on server and actual value on client after hydration
 */
export function useLocalStorageSSR<T>(
  key: string,
  initialValue: T
): [T | null, (value: T | ((val: T | null) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      setStoredValue(item ? JSON.parse(item) : initialValue)
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      setStoredValue(initialValue)
    } finally {
      setIsLoaded(true)
    }
  }, [key, initialValue])

  const setValue = (value: T | ((val: T | null) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, isLoaded]
}

/**
 * Hook for removing items from localStorage
 */
export function useLocalStorageRemove(key: string): () => void {
  const removeValue = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }

  return removeValue
}