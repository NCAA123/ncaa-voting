import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateElectionForm } from '@/components/elections/create-election-form'
import { toWatDatetimeLocal } from '@/lib/utils'

export default async function EditElectionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: electionId } = await params
  const supabase = await createClient()

  const { data: election, error } = await supabase
    .from('elections')
    .select('id, title, type, description, start_time, end_time, eligible_voter_categories, status')
    .eq('id', electionId)
    .single()

  if (error || !election) {
    notFound()
  }

  return (
    <CreateElectionForm
      mode="edit"
      electionId={election.id}
      defaultValues={{
        title: election.title,
        type: election.type,
        description: election.description || '',
        start_time: toWatDatetimeLocal(election.start_time),
        end_time: toWatDatetimeLocal(election.end_time),
        eligible_voter_categories: election.eligible_voter_categories || [],
        status: election.status,
      }}
    />
  )
}
