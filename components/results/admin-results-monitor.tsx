'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, AlertCircle } from 'lucide-react'
import { releaseResults } from '@/app/actions/voting'
import { getVotesTrendByHour, getZoneParticipation } from '@/app/actions/reads'
import { useToast } from '@/hooks/use-toast'

const supabase = createClient()

interface AdminResultsMonitorProps {
  electionId: string
  electionTitle: string
}

export function AdminResultsMonitor({ electionId, electionTitle }: AdminResultsMonitorProps) {
  const [voteTrend, setVoteTrend] = useState<any[]>([])
  const [zoneData, setZoneData] = useState<any[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [isReleasing, setIsReleasing] = useState(false)
  const [isReleased, setIsReleased] = useState(false)
  const { toast } = useToast()

  // Subscribe to vote count updates
  useEffect(() => {
    const channel = supabase
      .channel(`election-${electionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `election_id=eq.${electionId}`,
        },
        async () => {
          // Refetch trends and zone data on new vote
          const [trend, zones] = await Promise.all([
            getVotesTrendByHour(electionId),
            getZoneParticipation(electionId),
          ])
          setVoteTrend(trend)
          setZoneData(zones)

          // Update vote count
          const { count } = await supabase
            .from('votes')
            .select('id', { count: 'exact', head: true })
            .eq('election_id', electionId)
          setTotalVotes(count || 0)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [electionId])

  // Initial load of data
  useEffect(() => {
    const loadData = async () => {
      const [trend, zones, { count }] = await Promise.all([
        getVotesTrendByHour(electionId),
        getZoneParticipation(electionId),
        supabase.from('votes').select('id', { count: 'exact', head: true }).eq('election_id', electionId),
      ])

      setVoteTrend(trend)
      setZoneData(zones)
      setTotalVotes(count || 0)

      // Check if results already released
      const { data: election } = await supabase
        .from('elections')
        .select('results_released')
        .eq('id', electionId)
        .single()
      setIsReleased(!!election?.results_released)
    }

    loadData()
  }, [electionId])

  const handleReleaseResults = useCallback(async () => {
    setIsReleasing(true)
    try {
      const result = await releaseResults(electionId)
      if (result.success) {
        setIsReleased(true)
        toast({
          title: 'Success',
          description: 'Election results have been released',
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to release results',
          variant: 'destructive',
        })
      }
    } finally {
      setIsReleasing(false)
    }
  }, [electionId, toast])

  const handleExport = useCallback((format: 'pdf' | 'csv' | 'excel') => {
    // Export functionality will be added in separate component
    toast({
      title: 'Export',
      description: `Exporting results as ${format.toUpperCase()}...`,
    })
  }, [toast])

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{electionTitle} - Live Monitor</h1>
          <p className="text-gray-500 mt-1">Real-time voting statistics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button
            onClick={handleReleaseResults}
            disabled={isReleasing || isReleased}
            className="bg-green-600 hover:bg-green-700"
          >
            {isReleased ? 'Results Released' : 'Release Results'}
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {isReleased && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">Results are publicly visible to voters</span>
        </div>
      )}

      {/* Vote Count Card */}
      <Card>
        <CardHeader>
          <CardTitle>Total Votes Cast</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold text-blue-600">{totalVotes}</p>
        </CardContent>
      </Card>

      {/* Vote Trend Chart */}
      {voteTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Votes Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={voteTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Zone Participation Chart */}
      {zoneData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Participation by Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zoneData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zone" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="votes" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
