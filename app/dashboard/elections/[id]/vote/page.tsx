import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BallotForm } from '@/components/voting/ballot-form'
import { checkEligibility } from '@/app/actions/voting'
import { getElectionPositions } from '@/lib/supabase/voting-queries'

interface BallotPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: BallotPageProps) {
  const { id: electionId } = await params
  const supabase = await createClient()
  const { data: election } = await supabase
    .from('elections')
    .select('title')
    .eq('id', electionId)
    .single()

  return {
    title: `Voting: ${election?.title || 'Election'}`,
    description: 'Complete your ballot',
  }
}

export default async function BallotPage({ params }: BallotPageProps) {
  const { id: electionId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth')
  }

  // Check eligibility
  const eligibilityResult = await checkEligibility({ electionId })
  if (!eligibilityResult.success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-bold text-red-900">Not Eligible to Vote</h1>
          <p className="mt-2 text-red-800">{eligibilityResult.error}</p>
        </div>
      </div>
    )
  }

  // Get election details
  const { data: election, error: electionError } = await supabase
    .from('elections')
    .select('id, title, description, status')
    .eq('id', electionId)
    .single()

  if (electionError || !election) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-bold text-red-900">Election Not Found</h1>
        </div>
      </div>
    )
  }

  // Get positions
  const positions = await getElectionPositions(electionId)

  if (!positions || positions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-lg font-bold text-amber-900">No Positions Available</h1>
          <p className="mt-2 text-amber-800">
            This election has no positions configured yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{election.title}</h1>
        {election.description && (
          <p className="mt-2 text-gray-600">{election.description}</p>
        )}
      </div>

      <BallotForm electionId={electionId} positions={positions} />
    </div>
  )
}
