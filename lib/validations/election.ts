import { z } from 'zod'
import { ElectionType, ElectionStatus } from '@/types/elections'

export const createElectionSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must not exceed 255 characters'),
  type: z.enum(['general', 'zonal', 'committee', 'referendum', 'poll'], {
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
}).refine(
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

export type CreateElectionInput = z.infer<typeof createElectionSchema>
