'use client'

import { useEffect, useState } from 'react'
import { getCandidatesForPosition } from '@/app/actions/reads'
import { CandidateVoteCard } from './candidate-vote-card'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface PositionStepProps {
  positionId: string
  positionName: string
  maxVotes: number
  selectedCandidateIds: string[]
  onSelectionChange: (candidateIds: string[]) => void
}

interface Candidate {
  id: string
  photo_url?: string
  fide_title?: string
  zone?: string
  bio?: string
  profiles?: {
    first_name?: string
    last_name?: string
  }
}

export function PositionStep({
  positionId,
  positionName,
  maxVotes,
  selectedCandidateIds,
  onSelectionChange,
}: PositionStepProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        setLoading(true)
        const data = await getCandidatesForPosition(positionId)
        setCandidates(data)
        setError(null)
      } catch (err) {
        setError('Failed to load candidates')
        console.error('Error loading candidates:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCandidates()
  }, [positionId])

  const handleToggleCandidate = (candidateId: string, isSelected: boolean) => {
    if (isSelected) {
      // Check if we can add more votes
      if (selectedCandidateIds.length >= maxVotes) {
        return
      }
      onSelectionChange([...selectedCandidateIds, candidateId])
    } else {
      onSelectionChange(selectedCandidateIds.filter((id) => id !== candidateId))
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="font-medium text-red-900">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (candidates.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-900">No candidates are available for this position.</p>
      </Card>
    )
  }

  const canSelectMore = selectedCandidateIds.length < maxVotes

  return (
    <div className="space-y-6">
      {/* Position info */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{positionName}</h2>
        <p className="mt-2 text-sm text-gray-600">
          Select up to <span className="font-semibold">{maxVotes}</span> candidate
          {maxVotes !== 1 ? 's' : ''}
          {selectedCandidateIds.length > 0 && (
            <span className="ml-2 font-semibold text-blue-600">
              ({selectedCandidateIds.length} selected)
            </span>
          )}
        </p>
      </div>

      {/* Candidates list */}
      <div className="space-y-3">
        {candidates.map((candidate) => (
          <CandidateVoteCard
            key={candidate.id}
            id={candidate.id}
            name={
              candidate.profiles
                ? `${candidate.profiles.first_name || ''} ${candidate.profiles.last_name || ''}`.trim()
                : 'Unknown'
            }
            photo_url={candidate.photo_url}
            fide_title={candidate.fide_title}
            zone={candidate.zone}
            bio={candidate.bio}
            isSelected={selectedCandidateIds.includes(candidate.id)}
            onToggle={handleToggleCandidate}
          />
        ))}
      </div>

      {/* Selection limit warning */}
      {!canSelectMore && (
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-sm text-blue-900">
            You&apos;ve selected the maximum number of candidates for this position.
          </p>
        </div>
      )}
    </div>
  )
}
