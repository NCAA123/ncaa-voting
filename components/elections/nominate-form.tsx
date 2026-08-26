'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, X, Loader2, Search, UserCircle } from 'lucide-react'
import { nominateCandidate, searchMembers } from '@/app/actions/candidates'
import { useToast } from '@/hooks/use-toast'

interface Position {
  id: string
  title: string
}

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  zone: string | null
  arbiter_level: string | null
  avatar_url: string | null
}

interface NominateFormProps {
  electionId: string
  positions: Position[]
}

export function NominateForm({ electionId, positions }: NominateFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  // Candidate search/select
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  useEffect(() => {
    if (selectedMember || searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }

    let cancelled = false
    setIsSearching(true)
    const timeout = setTimeout(async () => {
      const results = await searchMembers(searchQuery)
      if (!cancelled) {
        setSearchResults(results)
        setIsSearching(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [searchQuery, selectedMember])

  const [formData, setFormData] = useState({
    positionId: '',
    bio: '',
    manifesto: '',
    fideTitle: '',
    achievements: '',
    videoUrl: '',
    socialLinks: {
      twitter: '',
      linkedin: '',
      facebook: '',
    },
  })

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 500 * 1024) {
        toast({
          title: 'File too large',
          description: 'Photo must be less than 500KB',
          variant: 'destructive',
        })
        return
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Only JPEG, PNG, and WebP are supported',
          variant: 'destructive',
        })
        return
      }

      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMember) {
      toast({
        title: 'Missing field',
        description: 'Search for and select the member to nominate',
        variant: 'destructive',
      })
      return
    }

    if (!formData.positionId) {
      toast({
        title: 'Missing field',
        description: 'Please select a position',
        variant: 'destructive',
      })
      return
    }

    const bioLength = formData.bio.trim().length
    if (bioLength < 50 || bioLength > 1000) {
      toast({
        title: 'Bio length',
        description: `Bio must be 50-1000 characters (currently ${bioLength})`,
        variant: 'destructive',
      })
      return
    }

    const manifestoLength = formData.manifesto.trim().length
    if (manifestoLength < 100 || manifestoLength > 5000) {
      toast({
        title: 'Manifesto length',
        description: `Manifesto must be 100-5000 characters (currently ${manifestoLength})`,
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const submitFormData = new FormData()
      if (photoFile) {
        submitFormData.append('photo', photoFile)
      }

      const result = await nominateCandidate(submitFormData, {
        electionId,
        positionId: formData.positionId,
        candidateUserId: selectedMember.id,
        bio: formData.bio,
        manifesto: formData.manifesto,
        fideTitle: formData.fideTitle,
        achievements: formData.achievements,
        videoUrl: formData.videoUrl,
        socialLinks: Object.keys(formData.socialLinks).reduce(
          (acc, key) => {
            if (formData.socialLinks[key as keyof typeof formData.socialLinks]) {
              acc[key as keyof typeof formData.socialLinks] =
                formData.socialLinks[key as keyof typeof formData.socialLinks]
            }
            return acc
          },
          {} as Record<string, string>
        ),
      })

      if (!result.success) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to nominate candidate',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Candidate nomination submitted successfully',
      })

      // The candidates page may already be cached client-side from before
      // this nomination (e.g. the admin came from there) -- without
      // refresh(), push() alone can serve that stale, pre-nomination list.
      router.refresh()
      router.push(`/admin/elections/${electionId}/candidates`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Candidate Information</h2>

        {/* Candidate search/select */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Member to Nominate *</label>
          {selectedMember ? (
            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted p-4">
              <div className="flex items-center gap-3">
                {selectedMember.avatar_url ? (
                  <img
                    src={selectedMember.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-10 w-10 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {selectedMember.first_name} {selectedMember.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedMember.email}
                    {selectedMember.zone ? ` · ${selectedMember.zone} Zone` : ''}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedMember(null)
                  setSearchQuery('')
                }}
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9"
              />
              {(isSearching || searchResults.length > 0) && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border bg-popover shadow-md">
                  {isSearching ? (
                    <div className="p-3 text-sm text-muted-foreground">Searching...</div>
                  ) : (
                    searchResults.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setSelectedMember(member)
                          setSearchResults([])
                        }}
                        className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted"
                      >
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-8 w-8 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Photo Upload */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Photo</label>
          <div className="space-y-4">
            {photoPreview ? (
              <div className="relative w-32 h-32">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(null)
                    setPhotoFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted transition"
              >
                <Upload className="mx-auto mb-2" size={24} />
                <p className="text-sm">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">Max 500KB (JPEG, PNG, WebP)</p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Position Select */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Position *</label>
          <Select value={formData.positionId} onValueChange={(value) => setFormData({ ...formData, positionId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              {positions.map((pos) => (
                <SelectItem key={pos.id} value={pos.id}>
                  {pos.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bio */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">
            Bio * <span className={`text-xs ${formData.bio.trim().length > 0 && (formData.bio.trim().length < 50 || formData.bio.trim().length > 1000) ? 'text-destructive' : 'text-muted-foreground'}`}>
              ({formData.bio.trim().length}/1000, min 50)
            </span>
          </label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Write a brief biography..."
            className="min-h-24"
            maxLength={1000}
          />
        </div>

        {/* Manifesto */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">
            Manifesto * <span className={`text-xs ${formData.manifesto.trim().length > 0 && (formData.manifesto.trim().length < 100 || formData.manifesto.trim().length > 5000) ? 'text-destructive' : 'text-muted-foreground'}`}>
              ({formData.manifesto.trim().length}/5000, min 100)
            </span>
          </label>
          <Textarea
            value={formData.manifesto}
            onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
            placeholder="Share your vision and plans..."
            className="min-h-32"
            maxLength={5000}
          />
        </div>

        {/* FIDE Title */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">FIDE Title</label>
          <Input
            value={formData.fideTitle}
            onChange={(e) => setFormData({ ...formData, fideTitle: e.target.value })}
            placeholder="e.g., Grandmaster, International Master"
          />
        </div>

        {/* Achievements */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Achievements</label>
          <Textarea
            value={formData.achievements}
            onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
            placeholder="List your key achievements..."
            className="min-h-20"
          />
        </div>

        {/* Video URL */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">YouTube Video URL</label>
          <Input
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            placeholder="youtube.com/watch?v=..."
            type="text"
          />
          <p className="text-xs text-muted-foreground mt-1">https:// is added automatically if you leave it out</p>
        </div>
      </Card>

      {/* Social Links */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Social Links</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">Twitter/X</label>
            <Input
              value={formData.socialLinks.twitter}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, twitter: e.target.value },
                })
              }
              placeholder="twitter.com/..."
              type="text"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">LinkedIn</label>
            <Input
              value={formData.socialLinks.linkedin}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, linkedin: e.target.value },
                })
              }
              placeholder="linkedin.com/in/..."
              type="text"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Facebook</label>
            <Input
              value={formData.socialLinks.facebook}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, facebook: e.target.value },
                })
              }
              placeholder="facebook.com/..."
              type="text"
            />
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 animate-spin" size={20} />}
        {isSubmitting ? 'Submitting...' : 'Submit Nomination'}
      </Button>
    </form>
  )
}
