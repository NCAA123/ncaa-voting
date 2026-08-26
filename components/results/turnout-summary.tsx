'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CheckCircle } from 'lucide-react'

interface TurnoutSummaryProps {
  totalVotes: number
  eligibleVoters: number
  turnoutPercentage: number
}

export function TurnoutSummary({
  totalVotes,
  eligibleVoters,
  turnoutPercentage,
}: TurnoutSummaryProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Voter Turnout
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Percentage Circle */}
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeDasharray={`${(turnoutPercentage / 100) * 314} 314`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold">{turnoutPercentage}%</p>
                  <p className="text-xs text-muted-foreground">Turnout</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">Votes Cast</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{totalVotes}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-purple-600" />
                <p className="text-sm font-medium text-purple-900">Eligible Voters</p>
              </div>
              <p className="text-2xl font-bold text-purple-700">{eligibleVoters}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
