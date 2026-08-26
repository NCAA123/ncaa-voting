import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getElectionStats,
  getVotesTrendByHour,
  getZoneParticipation,
} from '@/lib/supabase/voting-queries'
import { ElectionStatsCards } from '@/components/admin/election-stats-cards'
import { QuickActionsBar } from '@/components/admin/quick-actions-bar'
import { ElectionCharts } from '@/components/admin/election-charts'

export default async function ElectionOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: electionId } = await params
  const supabase = await createClient()

  // Admin-only access is already enforced by middleware on /admin/**;
  // this just needs the election itself.
  const { data: election, error: electionError } = await supabase
    .from('elections')
    .select('*')
    .eq('id', electionId)
    .single()

  if (electionError || !election) {
    notFound()
  }

  const stats = await getElectionStats(electionId)
  const voteTrend = await getVotesTrendByHour(electionId)
  const zoneParticipation = await getZoneParticipation(electionId)

  const canReleaseResults = election.status === 'closed' && !election.results_released
  const canCloseElection = election.status === 'active'

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">{election.title}</h1>
        <p className="text-muted-foreground mt-1">
          {election.type} Election • Status: {election.status}
        </p>
      </div>

      <QuickActionsBar
        electionId={electionId}
        canReleaseResults={canReleaseResults}
        canCloseElection={canCloseElection}
      />

      <ElectionStatsCards stats={stats} />

      <ElectionCharts voteTrend={voteTrend} zoneParticipation={zoneParticipation} />
    </div>
  )
}
