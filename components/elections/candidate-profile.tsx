'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bookmark, Share2, Link as LinkIcon, Twitter, Linkedin, Facebook } from 'lucide-react'
import { toggleBookmark } from '@/app/actions/candidates'
import { useToast } from '@/hooks/use-toast'

interface CandidateProfileProps {
  candidate: {
    id: string
    first_name: string
    last_name: string
    photo_url: string | null
    position_title: string
    fide_title: string | null
    zone: string
    bio: string
    manifesto: string
    achievements: string | null
    video_url: string | null
    isBookmarked?: boolean
  }
  electionId: string
  userId?: string
}

export function CandidateProfile({ candidate, electionId, userId }: CandidateProfileProps) {
  const { toast } = useToast()
  const [isBookmarked, setIsBookmarked] = useState(candidate.isBookmarked || false)
  const [isBookmarking, setIsBookmarking] = useState(false)

  const handleBookmark = async () => {
    if (!userId) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to bookmark candidates',
        variant: 'destructive',
      })
      return
    }

    setIsBookmarking(true)
    const result = await toggleBookmark(candidate.id)

    if (result.success) {
      setIsBookmarked(result.isBookmarked || false)
      toast({
        title: isBookmarked ? 'Bookmark removed' : 'Candidate bookmarked',
        description: `${candidate.first_name} ${candidate.last_name} has been ${result.isBookmarked ? 'added to' : 'removed from'} your bookmarks`,
      })
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update bookmark',
        variant: 'destructive',
      })
    }
    setIsBookmarking(false)
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: 'Link copied',
      description: 'Candidate profile link copied to clipboard',
    })
  }

  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const youtubeId = candidate.video_url ? extractYouTubeId(candidate.video_url) : null

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Photo */}
          <div className="flex-shrink-0">
            {candidate.photo_url ? (
              <Image
                src={candidate.photo_url}
                alt={`${candidate.first_name} ${candidate.last_name}`}
                width={200}
                height={200}
                className="rounded-lg border w-40 h-40 md:w-48 md:h-48 object-cover"
              />
            ) : (
              <div className="w-40 h-40 md:w-48 md:h-48 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">No photo</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="mb-4">
              <h1 className="text-3xl font-bold mb-2">{`${candidate.first_name} ${candidate.last_name}`}</h1>
              <div className="flex flex-wrap gap-2">
                <Badge>{candidate.position_title}</Badge>
                {candidate.fide_title && <Badge variant="secondary">{candidate.fide_title}</Badge>}
                {candidate.zone && <Badge variant="outline">{candidate.zone}</Badge>}
              </div>
            </div>

            {/* Bio */}
            <p className="text-foreground mb-6 leading-relaxed">{candidate.bio}</p>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBookmark}
                disabled={isBookmarking}
              >
                <Bookmark
                  size={16}
                  className="mr-2"
                  fill={isBookmarked ? 'currentColor' : 'none'}
                />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 size={16} className="mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Manifesto */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Manifesto</h2>
        <p className="whitespace-pre-wrap text-foreground leading-relaxed">{candidate.manifesto}</p>
      </Card>

      {/* Achievements */}
      {candidate.achievements && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Achievements</h2>
          <p className="whitespace-pre-wrap text-foreground leading-relaxed">{candidate.achievements}</p>
        </Card>
      )}

      {/* Video */}
      {youtubeId && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Campaign Video</h2>
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="Campaign Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            />
          </div>
        </Card>
      )}

      {/* Social Links */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Connect</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm">
            <Twitter size={16} className="mr-2" />
            Twitter
          </Button>
          <Button variant="outline" size="sm">
            <Linkedin size={16} className="mr-2" />
            LinkedIn
          </Button>
          <Button variant="outline" size="sm">
            <Facebook size={16} className="mr-2" />
            Facebook
          </Button>
        </div>
      </Card>
    </div>
  )
}
