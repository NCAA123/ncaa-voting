import { getCandidates } from '@/lib/supabase/queries'
import { ComparisonView } from '@/components/elections/comparison-view'

export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: electionId } = await params

  // Fetch only approved candidates for comparison
  const candidates = await getCandidates(electionId, 'approved')

  const formattedCandidates = candidates.map((candidate: any) => ({
    id: candidate.id,
    first_name: candidate.profiles?.first_name || 'Unknown',
    last_name: candidate.profiles?.last_name || 'Candidate',
    photo_url: candidate.photo_url,
    fide_title: candidate.fide_title,
    zone: candidate.zone,
    bio: candidate.bio,
    achievements: candidate.achievements,
    position_title: candidate.positions?.title || 'Position',
  }))

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Compare Candidates</h1>
      <p className="text-muted-foreground mb-6">
        Select 2-3 candidates from the same position to compare their profiles
      </p>

      <ComparisonView candidates={formattedCandidates} electionId={electionId} />
    </div>
  )
}
