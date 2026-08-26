import { getCandidates } from '@/lib/supabase/queries'
import { CandidatesManager } from '@/components/elections/candidates-manager'

interface CandidatesPageProps {
  params: Promise<{ id: string }>
}

export default async function CandidatesPage({ params }: CandidatesPageProps) {
  const { id } = await params
  const candidates = await getCandidates(id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Candidates</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve candidates for this election
        </p>
      </div>
      <CandidatesManager electionId={id} initialCandidates={candidates} />
    </div>
  )
}
