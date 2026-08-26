'use client'

import { ElectionCard } from './election-card'

interface Election {
  id: string
  title: string
  type: string
  status: 'draft' | 'scheduled' | 'active' | 'closed' | 'archived'
  description?: string
  start_time: string
  end_time: string
  positions_count: number
  hasVoted: boolean
}

interface ElectionsListProps {
  elections: Election[]
}

export function ElectionsList({ elections }: ElectionsListProps) {
  const now = new Date()

  // Group elections by status
  const activeElections = elections.filter(
    (e) => e.status === 'active' && new Date(e.end_time) > now
  )
  const upcomingElections = elections.filter(
    (e) => (e.status === 'scheduled' || e.status === 'active') && new Date(e.start_time) > now
  )
  const pastElections = elections.filter(
    (e) => e.status === 'closed' || e.status === 'archived' || new Date(e.end_time) <= now
  )

  const EmptyState = ({ title }: { title: string }) => (
    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
      <p className="text-gray-500">{title}</p>
    </div>
  )

  const ElectionGroup = ({
    title,
    elections: groupElections,
  }: {
    title: string
    elections: Election[]
  }) => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {groupElections.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()}`} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groupElections.map((election) => (
            <ElectionCard
              key={election.id}
              id={election.id}
              title={election.title}
              type={election.type}
              status={election.status}
              description={election.description}
              startTime={election.start_time}
              endTime={election.end_time}
              positionsCount={election.positions_count}
              isEligible
              hasVoted={election.hasVoted}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      <ElectionGroup title="Active Elections" elections={activeElections} />
      <ElectionGroup title="Upcoming Elections" elections={upcomingElections} />
      <ElectionGroup title="Past Elections" elections={pastElections} />
    </div>
  )
}
