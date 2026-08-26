import { z } from 'zod'
import { ElectionType, ElectionStatus } from '@/types/elections'

const electionFieldsShape = {
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must not exceed 255 characters'),
  type: z.enum(['general', 'special', 'runoff', 'zonal', 'committee', 'referendum', 'poll'], {
    errorMap: () => ({ message: 'Please select a valid election type' }),
  }),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  start_time: z
    .string()
    .refine((date) => {
      const d = new Date(date)
      return !isNaN(d.getTime())
    }, 'Invalid start date'),
  end_time: z
    .string()
    .refine((date) => {
      const d = new Date(date)
      return !isNaN(d.getTime())
    }, 'Invalid end date'),
  eligible_voter_categories: z
    .array(z.string())
    .min(1, 'Select at least one voter category'),
  status: z
    .enum(['draft', 'scheduled', 'active', 'closed', 'archived'], {
      errorMap: () => ({ message: 'Please select a valid status' }),
    })
    .default('draft'),
}

export const createElectionSchema = z.object(electionFieldsShape).refine(
  (data) => new Date(data.end_time) > new Date(data.start_time),
  {
    message: 'End time must be after start time',
    path: ['end_time'],
  }
).refine(
  (data) => new Date(data.start_time) > new Date(),
  {
    message: 'Start time must be in the future',
    path: ['start_time'],
  }
)

// Editing an existing election shouldn't require start_time to still be in
// the future -- you may be editing an election that's already active/closed.
export const updateElectionSchema = z.object(electionFieldsShape).extend({
  id: z.string().uuid('Invalid election ID'),
}).refine(
  (data) => new Date(data.end_time) > new Date(data.start_time),
  {
    message: 'End time must be after start time',
    path: ['end_time'],
  }
)

export type CreateElectionInput = z.infer<typeof createElectionSchema>
export type UpdateElectionInput = z.infer<typeof updateElectionSchema>
