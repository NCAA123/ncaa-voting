import { createClient } from '@/lib/supabase/server'
import { NominateForm } from '@/components/elections/nominate-form'
import { getPositions } from '@/lib/supabase/queries'
import { redirect } from 'next/navigation'

export default async function NominatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: electionId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, zone')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth')
  }

  // Get positions
  const positions = await getPositions(electionId)

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Nominate Candidate</h1>
      <p className="text-muted-foreground mb-6">Fill out the form below to nominate a candidate for this election</p>
      <NominateForm
        electionId={electionId}
        positions={positions}
        userProfile={profile}
      />
    </div>
  )
}
