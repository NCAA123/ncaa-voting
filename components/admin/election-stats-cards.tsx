'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Users, Vote, TrendingUp, Clock } from 'lucide-react'

interface ElectionStatsCardsProps {
  stats: {
    totalEligibleVoters: number
    votesCast: number
    turnoutPercentage: number
    candidateStats: {
      approved: number
      pending: number
      rejected: number
    }
    timeRemaining: string
  }
}

export function ElectionStatsCards({ stats }: ElectionStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Total Eligible Voters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Eligible Voters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEligibleVoters.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Total population</p>
        </CardContent>
      </Card>

      {/* Votes Cast */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Vote className="h-4 w-4 text-green-500" />
            Votes Cast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.votesCast.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Submitted votes</p>
        </CardContent>
      </Card>

      {/* Turnout Percentage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            Turnout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.turnoutPercentage}%</div>
          <Progress value={stats.turnoutPercentage} className="mt-2 h-1" />
        </CardContent>
      </Card>

      {/* Candidates Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Candidates</CardTitle>
          <CardDescription>Status breakdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Approved</span>
            <span className="font-semibold">{stats.candidateStats.approved}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-yellow-600">Pending</span>
            <span className="font-semibold">{stats.candidateStats.pending}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-red-600">Rejected</span>
            <span className="font-semibold">{stats.candidateStats.rejected}</span>
          </div>
        </CardContent>
      </Card>

      {/* Time Remaining */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.timeRemaining}</div>
          <p className="text-xs text-muted-foreground mt-1">Until election ends</p>
        </CardContent>
      </Card>
    </div>
  )
}
