import webpush from 'web-push'

// Configure web push. Subject must be a mailto: or https: URL -- passing
// the public key here (as this used to) throws on module load the moment
// both VAPID env vars are set.
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@ncaaweb.com.ng',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export interface PushNotification {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
}

export async function sendPushNotification(
  subscription: PushSubscriptionJSON,
  notification: PushNotification
): Promise<void> {
  try {
    const payload = JSON.stringify({
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icon-192.png',
        badge: notification.badge || '/badge-72.png',
        tag: notification.tag || 'default',
        requireInteraction: false,
      },
      data: notification.data || {},
    })

    await webpush.sendNotification(subscription as PushSubscription, payload)
  } catch (error) {
    console.error('Failed to send push notification:', error)
    throw error
  }
}

export async function notifyElectionStarted(
  subscriptions: PushSubscriptionJSON[],
  electionTitle: string,
  electionLink: string
): Promise<void> {
  const notification: PushNotification = {
    title: 'Election Started',
    body: `${electionTitle} is now open for voting`,
    tag: 'election-started',
    data: { url: electionLink },
  }

  const promises = subscriptions.map(sub => sendPushNotification(sub, notification))
  await Promise.allSettled(promises)
}

export async function notifyResultsReleased(
  subscriptions: PushSubscriptionJSON[],
  electionTitle: string,
  resultsLink: string
): Promise<void> {
  const notification: PushNotification = {
    title: 'Results Released',
    body: `Results for ${electionTitle} are now available`,
    tag: 'results-released',
    data: { url: resultsLink },
  }

  const promises = subscriptions.map(sub => sendPushNotification(sub, notification))
  await Promise.allSettled(promises)
}

export async function notifyCandidateStatus(
  subscription: PushSubscriptionJSON,
  candidateName: string,
  status: 'approved' | 'rejected',
  profileLink: string
): Promise<void> {
  const notification: PushNotification = {
    title: `Candidate Application ${status === 'approved' ? 'Approved' : 'Status Update'}`,
    body: `${candidateName}, your application status has been updated`,
    tag: 'candidate-status',
    data: { url: profileLink },
  }

  await sendPushNotification(subscription, notification)
}
