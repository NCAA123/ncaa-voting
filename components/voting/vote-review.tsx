'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface ReviewCandidate {
  id: string
  name: string
  photo_url?: string
  fide_title?: string
  zone?: string
}

interface VoteReviewProps {
  positionVotes: Array<{
    positionName: string
    maxVotes: number
    candidates: ReviewCandidate[]
  }>
  onEdit: (positionIndex: number) => void
  isSubmitting?: boolean
}

export function VoteReview({
  positionVotes,
  onEdit,
  isSubmitting = false,
}: VoteReviewProps) {
  const totalVotes = positionVotes.reduce((sum, pos) => sum + pos.candidates.length, 0)

  return (
    <div className="space-y-6">
      {/* Review header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Review Your Votes</h2>
        <p className="mt-2 text-sm text-gray-600">
          Please review your selections before submitting. You can edit any position by clicking
          the Edit button.
        </p>
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {positionVotes.map((position, posIndex) => (
          <Card key={posIndex} className="overflow-hidden">
            <div className="border-b bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{position.positionName}</h3>
                  <p className="text-sm text-gray-600">
                    {position.candidates.length} of {position.maxVotes} selected
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(posIndex)}
                  disabled={isSubmitting}
                >
                  Edit
                </Button>
              </div>
            </div>

            <div className="space-y-2 p-4">
              {position.candidates.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <p className="text-sm text-amber-900">No candidates selected</p>
                </div>
              ) : (
                position.candidates.map((candidate, candIndex) => (
                  <div
                    key={candIndex}
                    className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3"
                  >
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />

                    {candidate.photo_url && (
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
                        <Image
                          src={candidate.photo_url}
                          alt={candidate.name}
                          fill
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{candidate.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {candidate.fide_title && (
                          <Badge variant="secondary" className="text-xs">
                            {candidate.fide_title}
                          </Badge>
                        )}
                        {candidate.zone && (
                          <Badge variant="outline" className="text-xs">
                            {candidate.zone}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-900">Ready to submit</p>
            <p className="text-sm text-blue-800">
              Total votes: <span className="font-bold">{totalVotes}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Warning for incomplete voting */}
      {positionVotes.some((pos) => pos.candidates.length === 0) && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                Some positions have no selections
              </p>
              <p className="text-sm text-amber-800">
                You can still submit, but you won&apos;t vote in those positions.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
