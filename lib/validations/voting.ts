import { z } from 'zod'

export const voteSelectionSchema = z.object({
  positionId: z.string().uuid('Invalid position ID'),
  candidateIds: z.array(z.string().uuid('Invalid candidate ID')),
})

export const submitVoteSchema = z.object({
  electionId: z.string().uuid('Invalid election ID'),
  draftSelections: z.record(
    z.string(), // positionId
    z.array(z.string().uuid()) // candidateIds
  ),
})

export const checkEligibilitySchema = z.object({
  electionId: z.string().uuid('Invalid election ID'),
})

export type VoteSelection = z.infer<typeof voteSelectionSchema>
export type SubmitVoteInput = z.infer<typeof submitVoteSchema>
export type CheckEligibilityInput = z.infer<typeof checkEligibilitySchema>
