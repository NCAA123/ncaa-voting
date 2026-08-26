'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { CandidateCard } from './candidate-card'
import { getCandidateDocumentsAction } from '@/app/actions/candidates'

interface CandidatesManagerProps {
  electionId: string
  initialCandidates: any[]
}

type CandidateStatus = 'all' | 'pending' | 'approved' | 'rejected'

export function CandidatesManager({
  electionId,
  initialCandidates,
}: CandidatesManagerProps) {
  const [candidates, setCandidates] = useState(initialCandidates)
  const [activeStatus, setActiveStatus] = useState<CandidateStatus>('all')
  const [candidateDocuments, setCandidateDocuments] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Parent Server Component re-fetches and passes fresh candidates whenever
  // router.refresh() runs (see handleStatusChange).
  useEffect(() => {
    setCandidates(initialCandidates)
  }, [initialCandidates])

  const filteredCandidates =
    activeStatus === 'all'
      ? candidates
      : candidates.filter((c) => c.status === activeStatus)

  const statusCounts = {
    all: candidates.length,
    pending: candidates.filter((c) => c.status === 'pending').length,
    approved: candidates.filter((c) => c.status === 'approved').length,
    rejected: candidates.filter((c) => c.status === 'rejected').length,
  }

  // Fetch documents for any currently-visible candidate we haven't already
  // loaded, so CandidateCard can render synchronously.
  useEffect(() => {
    const missing = filteredCandidates.filter((c) => !(c.id in candidateDocuments))
    if (missing.length === 0) return

    let cancelled = false
    Promise.all(
      missing.map(async (c) => [c.id, await getCandidateDocumentsAction(c.id)] as const)
    ).then((entries) => {
      if (cancelled) return
      setCandidateDocuments((prev) => {
        const next = { ...prev }
        for (const [id, docs] of entries) next[id] = docs
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [filteredCandidates, candidateDocuments])

  const handleStatusChange = async () => {
    setIsLoading(true)
    router.refresh()
    setIsLoading(false)
    toast({
      title: 'Success',
      description: 'Candidate status updated',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Candidate Approval Queue</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve or reject candidates
        </p>
      </div>

      <div className="flex gap-2 border-b">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <Button
            key={status}
            variant={activeStatus === status ? 'default' : 'ghost'}
            onClick={() => setActiveStatus(status)}
            disabled={isLoading}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 text-xs font-semibold">({statusCounts[status]})</span>
          </Button>
        ))}
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {activeStatus === 'all'
              ? 'No candidates yet'
              : `No ${activeStatus} candidates`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              documents={candidateDocuments[candidate.id] || []}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
