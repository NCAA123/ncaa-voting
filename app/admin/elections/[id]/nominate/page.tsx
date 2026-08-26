import { NominateForm } from '@/components/elections/nominate-form'
import { getPositions } from '@/lib/supabase/queries'

export default async function NominatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: electionId } = await params

  // Admin-only access is already enforced by middleware on /admin/**.
  const positions = await getPositions(electionId)

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Nominate Candidate</h1>
      <p className="text-muted-foreground mb-6">Search for a member and nominate them as a candidate for this election</p>
      <NominateForm
        electionId={electionId}
        positions={positions}
      />
    </div>
  )
}
