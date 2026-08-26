'use client'

import { shouldLoadImages, useLowBandwidthMode } from '@/lib/hooks/use-low-bandwidth-mode'
import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
  fallback?: React.ReactNode
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  fallback,
}: OptimizedImageProps) {
  const { isLowBandwidth, isLoaded } = useLowBandwidthMode()
  const [imageError, setImageError] = useState(false)

  // Don't render until we know if low bandwidth mode is enabled
  if (!isLoaded) {
    return (
      <div
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ width, height }}
      />
    )
  }

  // If low bandwidth mode is on, show placeholder instead
  if (isLowBandwidth && !shouldLoadImages(isLowBandwidth)) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center text-gray-500 text-sm ${className}`}
        style={{ width, height }}
      >
        {fallback || 'Image disabled (Low bandwidth mode)'}
      </div>
    )
  }

  // If image failed to load, show fallback
  if (imageError) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center text-gray-400 text-sm ${className}`}
        style={{ width, height }}
      >
        {fallback || 'Image unavailable'}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      onError={() => setImageError(true)}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  )
}
