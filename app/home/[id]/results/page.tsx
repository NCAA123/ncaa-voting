import { redirect } from 'next/navigation'
import { PositionResultsChart } from '@/components/results/position-results-chart'
import { TurnoutSummary } from '@/components/results/turnout-summary'
import { getElectionResults, getTurnoutStats } from '@/lib/supabase/voting-queries'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: electionId } = await params
  const supabase = await createClient()

  // Verify election exists and results are released
  const { data: election, error: electionError } = await supabase
    .from('elections')
    .select('title, status, results_released, results_released_at, type')
    .eq('id', electionId)
    .single()

  if (electionError || !election) {
    redirect(`/home/${electionId}`)
  }

  // Check if results are available
  if (!election.results_released) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-yellow-900 mb-2">Results Not Yet Available</h2>
            <p className="text-yellow-700">
              Election results will be displayed once the voting period ends and results are
              officially released.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Fetch results data
  const [results, turnoutStats] = await Promise.all([
    getElectionResults(electionId),
    getTurnoutStats(electionId),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{election.title}</h1>
          <p className="text-gray-600">Election Results</p>
          {election.results_released_at && (
            <p className="text-sm text-gray-500 mt-2">
              Released on {formatDate(election.results_released_at)}
            </p>
          )}
        </div>

        {/* Turnout Summary */}
        <div className="mb-8">
          <TurnoutSummary
            totalVotes={turnoutStats.totalVotes}
            eligibleVoters={turnoutStats.eligibleVoters}
            turnoutPercentage={turnoutStats.turnoutPercentage}
          />
        </div>

        {/* Position Results */}
        {results && results.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Position Results</h2>
            {results.map((position: any) => (
              <PositionResultsChart key={position.id} position={position} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No votes recorded for this election</p>
          </div>
        )}
      </div>
    </div>
  )
}
