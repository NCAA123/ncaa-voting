import { z } from 'zod'

const MAX_FILE_SIZE = 500 * 1024 // 500KB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const nominateCandidateSchema = z.object({
  electionId: z.string().uuid('Invalid election ID'),
  positionId: z.string().uuid('Invalid position ID'),
  candidateUserId: z.string().uuid('Select a member to nominate'),
  bio: z.string().min(50, 'Bio must be at least 50 characters').max(1000, 'Bio must be less than 1000 characters'),
  manifesto: z.string().min(100, 'Manifesto must be at least 100 characters').max(5000, 'Manifesto must be less than 5000 characters'),
  fideTitle: z.string().max(50, 'FIDE title is too long').optional().or(z.literal('')),
  achievements: z.string().max(2000, 'Achievements must be less than 2000 characters').optional().or(z.literal('')),
  videoUrl: z.string().url('Invalid video URL').optional().or(z.literal('')),
  socialLinks: z.object({
    twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
    linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
    facebook: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
  }).optional(),
})

export const photoUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, `Photo size must be less than 500KB`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
})

export type NominateCandidateInput = z.infer<typeof nominateCandidateSchema>
export type PhotoUploadInput = z.infer<typeof photoUploadSchema>
