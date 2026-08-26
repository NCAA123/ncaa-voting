import { getPositions } from '@/lib/supabase/queries'
import { PositionsManager } from '@/components/elections/positions-manager'

interface PositionsPageProps {
  params: Promise<{ id: string }>
}

export default async function PositionsPage({ params }: PositionsPageProps) {
  const { id } = await params
  const positions = await getPositions(id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Positions</h1>
        <p className="text-muted-foreground mt-2">
          Create and organize positions for this election
        </p>
      </div>
      <PositionsManager electionId={id} initialPositions={positions} />
    </div>
  )
}
