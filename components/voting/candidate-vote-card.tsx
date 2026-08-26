'use client'

import Image from 'next/image'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'

interface CandidateVoteCardProps {
  id: string
  name: string
  photo_url?: string | null
  fide_title?: string
  zone?: string
  bio?: string
  isSelected: boolean
  onToggle: (candidateId: string, selected: boolean) => void
}

export function CandidateVoteCard({
  id,
  name,
  photo_url,
  fide_title,
  zone,
  bio,
  isSelected,
  onToggle,
}: CandidateVoteCardProps) {
  const handleChange = (checked: boolean) => {
    onToggle(id, checked)
  }

  const bioExcerpt = bio ? (bio.length > 120 ? `${bio.substring(0, 120)}...` : bio) : ''

  return (
    <Card
      className={`overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-gray-300'
      }`}
    >
      <div className="p-4">
        <div className="flex gap-4">
          {/* Photo */}
          <div className="flex-shrink-0">
            <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-gray-100">
              {photo_url ? (
                <Image
                  src={photo_url}
                  alt={name}
                  fill
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200">
                  <span className="text-xs text-gray-500">No photo</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">{name}</h3>
                {fide_title && (
                  <p className="text-xs font-medium text-blue-700">{fide_title}</p>
                )}
              </div>

              {/* Checkbox */}
              <Checkbox checked={isSelected} onCheckedChange={handleChange} />
            </div>

            {/* Zone and bio */}
            <div className="space-y-1">
              {zone && <p className="text-xs text-gray-600">Zone: {zone}</p>}
              {bioExcerpt && (
                <p className="line-clamp-2 text-sm text-gray-700">{bioExcerpt}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
