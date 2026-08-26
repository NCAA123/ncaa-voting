'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { X } from 'lucide-react'

interface Candidate {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
  fide_title: string | null
  zone: string
  bio: string
  achievements: string | null
  position_title: string
}

interface ComparisonViewProps {
  candidates: Candidate[]
  electionId: string
}

export function ComparisonView({ candidates, electionId }: ComparisonViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const selectedCandidates = useMemo(
    () => candidates.filter((c) => selectedIds.includes(c.id)),
    [candidates, selectedIds]
  )

  const handleSelectCandidate = (candidateId: string) => {
    if (selectedIds.includes(candidateId)) {
      setSelectedIds(selectedIds.filter((id) => id !== candidateId))
    } else if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, candidateId])
    }
  }

  const handleClearSelection = () => {
    setSelectedIds([])
  }

  // Group candidates by position
  const candidatesByPosition = useMemo(() => {
    const grouped: Record<string, Candidate[]> = {}
    candidates.forEach((candidate) => {
      if (!grouped[candidate.position_title]) {
        grouped[candidate.position_title] = []
      }
      grouped[candidate.position_title].push(candidate)
    })
    return grouped
  }, [candidates])

  return (
    <div className="space-y-6">
      {/* Selection Guide */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          Select 2-3 candidates from the same position to compare them side-by-side
          {selectedIds.length > 0 && ` (${selectedIds.length}/3 selected)`}
        </p>
      </Card>

      {/* Candidate Grid */}
      <div className="space-y-8">
        {Object.entries(candidatesByPosition).map(([position, positionCandidates]) => (
          <div key={position}>
            <h2 className="text-xl font-bold mb-4">{position}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {positionCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className={`cursor-pointer transition ${
                    selectedIds.includes(candidate.id) ? 'ring-2 ring-primary rounded-lg' : ''
                  }`}
                  onClick={() => handleSelectCandidate(candidate.id)}
                >
                  <Card className="p-4 h-full">
                    <div className="flex items-start justify-between mb-3">
                      <Checkbox
                        checked={selectedIds.includes(candidate.id)}
                        disabled={selectedIds.length >= 3 && !selectedIds.includes(candidate.id)}
                      />
                      {selectedIds.includes(candidate.id) && (
                        <Badge className="bg-primary">Selected</Badge>
                      )}
                    </div>

                    {/* Photo */}
                    <div className="mb-4">
                      {candidate.photo_url ? (
                        <Image
                          src={candidate.photo_url}
                          alt={`${candidate.first_name} ${candidate.last_name}`}
                          width={150}
                          height={150}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No photo</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <h3 className="font-semibold mb-1">{`${candidate.first_name} ${candidate.last_name}`}</h3>
                    {candidate.fide_title && (
                      <p className="text-xs text-muted-foreground mb-2">{candidate.fide_title}</p>
                    )}
                    <p className="text-xs text-muted-foreground mb-3">{candidate.zone}</p>

                    {/* Bio Preview */}
                    <p className="text-xs text-foreground line-clamp-3 mb-4">{candidate.bio}</p>

                    <Link href={`/home/${electionId}/candidates/${candidate.id}`}>
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        View Full Profile
                      </Button>
                    </Link>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Cards */}
      {selectedCandidates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Side-by-Side Comparison</h2>
            <Button variant="ghost" size="sm" onClick={handleClearSelection}>
              Clear Selection
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedCandidates.map((candidate) => (
              <Card key={candidate.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold">{`${candidate.first_name} ${candidate.last_name}`}</h3>
                  <button
                    onClick={() => handleSelectCandidate(candidate.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Photo */}
                {candidate.photo_url ? (
                  <Image
                    src={candidate.photo_url}
                    alt={`${candidate.first_name} ${candidate.last_name}`}
                    width={200}
                    height={200}
                    className="w-full h-40 object-cover rounded-lg border mb-4"
                  />
                ) : (
                  <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center mb-4">
                    <span className="text-xs text-muted-foreground">No photo</span>
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {candidate.fide_title && <Badge variant="secondary">{candidate.fide_title}</Badge>}
                  <Badge variant="outline">{candidate.zone}</Badge>
                </div>

                {/* Bio */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">About</h4>
                  <p className="text-sm text-foreground line-clamp-4">{candidate.bio}</p>
                </div>

                {/* Achievements Preview */}
                {candidate.achievements && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2">Key Achievements</h4>
                    <p className="text-sm text-foreground line-clamp-3">{candidate.achievements}</p>
                  </div>
                )}

                <Link href={`/home/${electionId}/candidates/${candidate.id}`}>
                  <Button className="w-full" size="sm">
                    View Full Profile
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
