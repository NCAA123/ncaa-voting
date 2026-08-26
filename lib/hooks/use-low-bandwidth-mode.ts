import { useEffect, useState } from 'react'

const STORAGE_KEY = 'ncaa-low-bandwidth-mode'

export function useLowBandwidthMode() {
  const [isLowBandwidth, setIsLowBandwidth] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      setIsLowBandwidth(saved === 'true')
    } else {
      // Check system preference for reduced data
      if (navigator.connection?.saveData) {
        setIsLowBandwidth(true)
      }
    }
    setIsLoaded(true)
  }, [])

  const toggleLowBandwidth = (enabled: boolean) => {
    setIsLowBandwidth(enabled)
    localStorage.setItem(STORAGE_KEY, String(enabled))
  }

  return {
    isLowBandwidth,
    isLoaded,
    toggleLowBandwidth,
  }
}

export function shouldLoadImages(isLowBandwidth: boolean): boolean {
  if (isLowBandwidth) {
    // Check if on wifi or have good connection
    if (navigator.connection) {
      const { effectiveType, saveData } = navigator.connection as any
      if (saveData) return false
      if (effectiveType && effectiveType.includes('2g')) return false
    }
  }
  return true
}
