import { z } from 'zod'

export const approveCandidateSchema = z.object({
  candidate_id: z.string().uuid('Invalid candidate ID'),
  election_id: z.string().uuid('Invalid election ID'),
})

export const rejectCandidateSchema = z.object({
  candidate_id: z.string().uuid('Invalid candidate ID'),
  election_id: z.string().uuid('Invalid election ID'),
  rejection_reason: z.string().min(1, 'Rejection reason is required').max(500),
})

export type ApproveCandidateInput = z.infer<typeof approveCandidateSchema>
export type RejectCandidateInput = z.infer<typeof rejectCandidateSchema>
