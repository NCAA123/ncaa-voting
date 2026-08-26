import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateElectionForm } from '@/components/elections/create-election-form'

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in local time, not an ISO
// string with seconds/timezone.
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

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
        start_time: toDatetimeLocal(election.start_time),
        end_time: toDatetimeLocal(election.end_time),
        eligible_voter_categories: election.eligible_voter_categories || [],
        status: election.status,
      }}
    />
  )
}
