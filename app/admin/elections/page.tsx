import { Metadata } from 'next'
import Link from 'next/link'
import { getElections } from '@/lib/supabase/queries'
import { ElectionsTable } from '@/components/elections/elections-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Elections',
  description: 'Manage NCAA elections',
}

export default async function ElectionsPage() {
  const elections = await getElections()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Elections</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage and monitor all elections
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/elections/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Election
          </Link>
        </Button>
      </div>

      <ElectionsTable elections={elections} />
    </div>
  )
}
