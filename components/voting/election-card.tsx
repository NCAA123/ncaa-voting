'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { differenceInSeconds } from 'date-fns'
import { Clock, MapPin, Users } from 'lucide-react'
import { formatWatDateTime } from '@/lib/utils'

interface ElectionCardProps {
  id: string
  title: string
  type: string
  status: 'draft' | 'scheduled' | 'active' | 'closed' | 'archived'
  description?: string
  startTime: string
  endTime: string
  positionsCount: number
  isEligible: boolean
  hasVoted: boolean
}

export function ElectionCard({
  id,
  title,
  type,
  status,
  description,
  startTime,
  endTime,
  positionsCount,
  isEligible,
  hasVoted,
}: ElectionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'active') {
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const endDate = new Date(endTime)
      const secondsLeft = differenceInSeconds(endDate, now)

      if (secondsLeft <= 0) {
        setTimeRemaining('Closed')
        return
      }

      const days = Math.floor(secondsLeft / 86400)
      const hours = Math.floor((secondsLeft % 86400) / 3600)
      const minutes = Math.floor((secondsLeft % 3600) / 60)

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`)
      } else {
        setTimeRemaining(`${minutes}m`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000)

    return () => clearInterval(interval)
  }, [status, endTime])

  const statusColorMap = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    closed: 'bg-orange-100 text-orange-800',
    archived: 'bg-purple-100 text-purple-800',
  }

  const statusLabelMap = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    active: 'Active',
    closed: 'Closed',
    archived: 'Archived',
  }

  const typeLabel = {
    general: 'General',
    special: 'Special',
    runoff: 'Runoff',
    zonal: 'Zonal',
    committee: 'Committee',
    referendum: 'Referendum',
    poll: 'Poll',
  }[type] || type

  const ctaLink = hasVoted ? `/home/${id}/results` : `/dashboard/elections/${id}/vote`
  const ctaLabel = hasVoted ? 'View Results' : 'Vote Now'

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </div>

          {/* Status badge */}
          <Badge className={statusColorMap[status]}>
            {statusLabelMap[status]}
          </Badge>
        </div>

        {/* Election info */}
        <div className="space-y-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{positionsCount} positions</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <div>
              <div>{formatWatDateTime(startTime)}</div>
              {status === 'active' && timeRemaining && (
                <div className="text-xs font-semibold text-green-600">
                  {timeRemaining} remaining
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Type and eligibility */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="outline">{typeLabel}</Badge>

          {!isEligible && (
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              Not Eligible
            </Badge>
          )}
        </div>

        {/* CTA Button */}
        <Button
          asChild
          disabled={!isEligible || (status !== 'active' && !hasVoted)}
          className="w-full"
        >
          <Link href={ctaLink}>
            {!isEligible ? 'Not Eligible' : ctaLabel}
          </Link>
        </Button>
      </div>
    </Card>
  )
}
