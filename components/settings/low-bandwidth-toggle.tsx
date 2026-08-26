'use client'

import { useLowBandwidthMode } from '@/lib/hooks/use-low-bandwidth-mode'
import { Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

export function LowBandwidthToggle() {
  const { isLowBandwidth, isLoaded, toggleLowBandwidth } = useLowBandwidthMode()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isLoaded) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800">
      <button
        onClick={() => toggleLowBandwidth(!isLowBandwidth)}
        className="flex items-center gap-2 text-sm font-medium"
        aria-label={`Turn ${isLowBandwidth ? 'off' : 'on'} low bandwidth mode`}
      >
        {isLowBandwidth ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="hidden sm:inline">Low Bandwidth</span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            <span className="hidden sm:inline">Normal</span>
          </>
        )}
      </button>
    </div>
  )
}
