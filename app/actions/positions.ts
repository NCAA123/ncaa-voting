'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createPositionSchema,
  updatePositionSchema,
  deletePositionSchema,
  reorderPositionsSchema,
  type CreatePositionInput,
  type UpdatePositionInput,
  type DeletePositionInput,
  type ReorderPositionsInput,
} from '@/lib/validations/positions'

interface ActionResponse {
  success: boolean
  error?: string
  data?: any
}

async function checkAdminPermissions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return profile?.role === 'admin' || profile?.role === 'superadmin'
}

export async function createPosition(input: CreatePositionInput): Promise<ActionResponse> {
  try {
    const validatedData = createPositionSchema.parse(input)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const isAdmin = await checkAdminPermissions(supabase, user.id)
    if (!isAdmin) {
      return { success: false, error: 'Only admins can create positions' }
    }

    // Get max display_order for this election
    const { data: positions } = await supabase
      .from('positions')
      .select('display_order')
      .eq('election_id', validatedData.election_id)
      .order('display_order', { ascending: false })
      .limit(1)

    const maxOrder = positions?.[0]?.display_order ?? -1
    const newOrder = validatedData.display_order ?? maxOrder + 1

    const { data: newPosition, error } = await supabase
      .from('positions')
      .insert({
        ...validatedData,
        display_order: newOrder,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: newPosition }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function updatePosition(input: UpdatePositionInput): Promise<ActionResponse> {
  try {
    const validatedData = updatePositionSchema.parse(input)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const isAdmin = await checkAdminPermissions(supabase, user.id)
    if (!isAdmin) {
      return { success: false, error: 'Only admins can update positions' }
    }

    const { id, ...updateData } = validatedData

    const { data: updatedPosition, error } = await supabase
      .from('positions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: updatedPosition }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function deletePosition(input: DeletePositionInput): Promise<ActionResponse> {
  try {
    const validatedData = deletePositionSchema.parse(input)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const isAdmin = await checkAdminPermissions(supabase, user.id)
    if (!isAdmin) {
      return { success: false, error: 'Only admins can delete positions' }
    }

    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', validatedData.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function reorderPositions(input: ReorderPositionsInput): Promise<ActionResponse> {
  try {
    const validatedData = reorderPositionsSchema.parse(input)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const isAdmin = await checkAdminPermissions(supabase, user.id)
    if (!isAdmin) {
      return { success: false, error: 'Only admins can reorder positions' }
    }

    // Batch update all positions
    const updates = validatedData.positions.map((pos) =>
      supabase
        .from('positions')
        .update({ display_order: pos.display_order })
        .eq('id', pos.id)
    )

    const results = await Promise.all(updates)

    // Check for errors
    const hasError = results.some((result) => result.error)
    if (hasError) {
      return {
        success: false,
        error: 'Failed to reorder positions',
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
