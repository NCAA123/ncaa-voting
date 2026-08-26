import { createClient } from '@/lib/supabase/server'
import { CandidateProfile } from '@/components/elections/candidate-profile'
import { getCandidateById } from '@/lib/supabase/queries'
import { notFound } from 'next/navigation'

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ id: string; candidateId: string }>
}) {
  const { id: electionId, candidateId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const candidateData = await getCandidateById(candidateId, user?.id)

  if (!candidateData) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <CandidateProfile
        candidate={{
          id: candidateData.id,
          first_name: candidateData.profiles?.first_name || 'Unknown',
          last_name: candidateData.profiles?.last_name || 'Candidate',
          photo_url: candidateData.photo_url,
          position_title: candidateData.positions?.title || 'Position',
          fide_title: candidateData.fide_title,
          zone: candidateData.zone,
          bio: candidateData.bio,
          manifesto: candidateData.manifesto,
          achievements: candidateData.achievements,
          video_url: candidateData.video_url,
          isBookmarked: candidateData.isBookmarked,
        }}
        electionId={electionId}
        userId={user?.id}
      />
    </div>
  )
}
