'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { confirmAndStoreVotes } from '@/app/actions/voting'
import { BallotProgress } from './ballot-progress'
import { PositionStep } from './position-step'
import { VoteReview } from './vote-review'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const DRAFT_STORAGE_KEY = (electionId: string) => `election_${electionId}_draft`

interface BallotFormProps {
  electionId: string
  positions: Array<{
    id: string
    title: string
    max_votes: number
    display_order: number
  }>
}

interface DraftSelections {
  [positionId: string]: string[]
}

interface PositionVote {
  positionName: string
  maxVotes: number
  candidates: Array<{
    id: string
    name: string
    photo_url?: string
    fide_title?: string
    zone?: string
  }>
}

export function BallotForm({ electionId, positions }: BallotFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState(1)
  const [draftSelections, setDraftSelections] = useState<DraftSelections>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [candidateCache, setCandidateCache] = useState<
    Record<
      string,
      Array<{
        id: string
        name: string
        photo_url?: string
        fide_title?: string
        zone?: string
      }>
    >
  >({})

  const totalSteps = positions.length + 1 // +1 for review step

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY(electionId))
    if (savedDraft) {
      try {
        setDraftSelections(JSON.parse(savedDraft))
      } catch (err) {
        console.error('Failed to load draft:', err)
      }
    }
  }, [electionId])

  // Save draft to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(DRAFT_STORAGE_KEY(electionId), JSON.stringify(draftSelections))
  }, [draftSelections, electionId])

  const isReviewStep = currentStep === totalSteps
  const currentPosition = !isReviewStep ? positions[currentStep - 1] : null

  const handleSelectionChange = (candidateIds: string[]) => {
    if (currentPosition) {
      setDraftSelections({
        ...draftSelections,
        [currentPosition.id]: candidateIds,
      })
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      setError(null)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      const result = await confirmAndStoreVotes({
        electionId,
        draftSelections,
      })

      if (!result.success) {
        setError(result.error || 'Failed to submit vote')
        return
      }

      // Clear localStorage on success
      localStorage.removeItem(DRAFT_STORAGE_KEY(electionId))

      toast({
        title: 'Vote Submitted Successfully',
        description: `Your vote has been recorded. Receipt ID: ${result.data?.receiptId}`,
      })

      // /dashboard/elections/[id] doesn't exist as a page -- the real
      // post-vote destination is the receipt page, which reads the hash
      // straight from the URL.
      router.refresh()
      router.push(`/home/${electionId}/receipt?hash=${result.receiptHash}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPosition = (positionIndex: number) => {
    setCurrentStep(positionIndex + 1)
    window.scrollTo(0, 0)
  }

  // Prepare review data
  const reviewData: PositionVote[] = positions.map((position) => ({
    positionName: position.title,
    maxVotes: position.max_votes,
    candidates: (draftSelections[position.id] || []).map((candidateId) => {
      // For review, we don't have candidate details cached yet
      // In real implementation, fetch or use cached data
      return {
        id: candidateId,
        name: 'Loading...',
        photo_url: undefined,
        fide_title: undefined,
        zone: undefined,
      }
    }),
  }))

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <BallotProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        positionNames={positions.map((p) => p.title)}
      />

      {/* Error message */}
      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-red-900">{error}</p>
          </div>
        </Card>
      )}

      {/* Main content */}
      <Card className="p-6">
        {isReviewStep ? (
          <VoteReview
            positionVotes={reviewData}
            onEdit={handleEditPosition}
            isSubmitting={isSubmitting}
          />
        ) : currentPosition ? (
          <PositionStep
            positionId={currentPosition.id}
            positionName={currentPosition.title}
            maxVotes={currentPosition.max_votes}
            selectedCandidateIds={draftSelections[currentPosition.id] || []}
            onSelectionChange={handleSelectionChange}
          />
        ) : null}
      </Card>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        {!isReviewStep ? (
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="ml-auto gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="ml-auto"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Vote'}
          </Button>
        )}
      </div>
    </div>
  )
}
