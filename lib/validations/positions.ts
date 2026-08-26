import { z } from 'zod'

export const createPositionSchema = z.object({
  election_id: z.string().uuid('Invalid election ID'),
  title: z.string().min(1, 'Position title is required').max(255),
  max_votes: z.number().int().min(1, 'Must allow at least 1 vote').max(100),
  display_order: z.number().int().min(0).optional(),
})

export const updatePositionSchema = createPositionSchema.partial().extend({
  id: z.string().uuid('Invalid position ID'),
})

export const deletePositionSchema = z.object({
  id: z.string().uuid('Invalid position ID'),
})

export const reorderPositionsSchema = z.object({
  positions: z.array(
    z.object({
      id: z.string().uuid(),
      display_order: z.number().int().min(0),
    })
  ),
})

export type CreatePositionInput = z.infer<typeof createPositionSchema>
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>
export type DeletePositionInput = z.infer<typeof deletePositionSchema>
export type ReorderPositionsInput = z.infer<typeof reorderPositionsSchema>
