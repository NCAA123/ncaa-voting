'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, X, Loader2 } from 'lucide-react'
import { nominateCandidate } from '@/app/actions/candidates'
import { useToast } from '@/hooks/use-toast'

interface Position {
  id: string
  title: string
}

interface NominateFormProps {
  electionId: string
  positions: Position[]
  userProfile: {
    first_name: string
    last_name: string
    zone: string
  }
}

export function NominateForm({ electionId, positions, userProfile }: NominateFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

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

    if (!formData.positionId) {
      toast({
        title: 'Missing field',
        description: 'Please select a position',
        variant: 'destructive',
      })
      return
    }

    if (!formData.bio.trim()) {
      toast({
        title: 'Missing field',
        description: 'Bio is required',
        variant: 'destructive',
      })
      return
    }

    if (!formData.manifesto.trim()) {
      toast({
        title: 'Missing field',
        description: 'Manifesto is required',
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

        {/* Pre-filled Profile Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted rounded-lg">
          <div>
            <label className="text-sm font-medium">Name</label>
            <p className="text-foreground">{`${userProfile.first_name} ${userProfile.last_name}`}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Zone</label>
            <p className="text-foreground">{userProfile.zone}</p>
          </div>
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
            Bio * <span className="text-xs text-muted-foreground">(50-1000 characters)</span>
          </label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Write a brief biography..."
            className="min-h-24"
          />
        </div>

        {/* Manifesto */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">
            Manifesto * <span className="text-xs text-muted-foreground">(100-5000 characters)</span>
          </label>
          <Textarea
            value={formData.manifesto}
            onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
            placeholder="Share your vision and plans..."
            className="min-h-32"
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
            placeholder="https://youtube.com/watch?v=..."
            type="url"
          />
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
              placeholder="https://twitter.com/..."
              type="url"
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
              placeholder="https://linkedin.com/in/..."
              type="url"
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
              placeholder="https://facebook.com/..."
              type="url"
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
