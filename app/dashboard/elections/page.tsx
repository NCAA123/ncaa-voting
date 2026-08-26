import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ElectionsList } from '@/components/voting/elections-list'
import { getElectionsForVoter } from '@/lib/supabase/voting-queries'

export const metadata = {
  title: 'Elections Dashboard',
  description: 'View and participate in elections',
}

export default async function ElectionsDashboardPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth')
  }

  // Get elections for voter
  const elections = await getElectionsForVoter(user.id)

  if (!elections || elections.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Elections</h1>
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">
            No elections are currently available. Check back soon!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Elections</h1>
        <p className="mt-2 text-gray-600">
          View and participate in ongoing and upcoming elections.
        </p>
      </div>

      <ElectionsList elections={elections} />
    </div>
  )
}
