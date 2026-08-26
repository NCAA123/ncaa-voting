import { createClient } from '@/lib/supabase/server'
import { AdminResultsMonitor } from '@/components/results/admin-results-monitor'
import { redirect } from 'next/navigation'

export default async function AdminMonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: electionId } = await params
  const supabase = await createClient()

  // Admin-only access is already enforced by middleware on /admin/**;
  // this just needs the election itself.
  const { data: election, error: electionError } = await supabase
    .from('elections')
    .select('title, status')
    .eq('id', electionId)
    .single()

  if (electionError || !election) {
    redirect('/admin/elections')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <AdminResultsMonitor electionId={electionId} electionTitle={election.title} />
      </div>
    </div>
  )
}
