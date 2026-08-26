import { useEffect, useState } from 'react'

interface UsePushSubscriptionOptions {
  onSubscribed?: (subscription: PushSubscription) => void
  onError?: (error: Error) => void
}

export function usePushSubscription({
  onSubscribed,
  onError,
}: UsePushSubscriptionOptions = {}) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false)
      setIsLoading(false)
      return
    }

    setIsSupported(true)

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
          setIsSubscribed(true)
          onSubscribed?.(subscription)
        } else {
          setIsSubscribed(false)
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error')
        onError?.(err)
      } finally {
        setIsLoading(false)
      }
    }

    checkSubscription()
  }, [onSubscribed, onError])

  const subscribe = async (): Promise<PushSubscription | null> => {
    if (!isSupported) {
      const error = new Error('Push notifications are not supported')
      onError?.(error)
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ),
      })

      setIsSubscribed(true)
      onSubscribed?.(subscription)

      return subscription
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to subscribe')
      onError?.(err)
      return null
    }
  }

  const unsubscribe = async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        setIsSubscribed(false)
        return true
      }

      return false
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to unsubscribe')
      onError?.(err)
      return false
    }
  }

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
