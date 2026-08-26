'use server'

import { createClient } from '@/lib/supabase/server'
import { createElectionSchema } from '@/lib/validations/election'
import type { CreateElectionInput } from '@/lib/validations/election'

interface CreateElectionResponse {
  success: boolean
  data?: {
    id: string
    title: string
  }
  error?: string
}

export async function createElection(
  input: CreateElectionInput
): Promise<CreateElectionResponse> {
  try {
    // Validate input
    const validatedData = createElectionSchema.parse(input)
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: User not authenticated',
      }
    }

    // Get user profile to check if they are admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Unable to verify admin permissions',
      }
    }

    if (profile.role !== 'admin' && profile.role !== 'superadmin') {
      return {
        success: false,
        error: 'Unauthorized: Only admins can create elections',
      }
    }

    // Insert election into database
    const { data: election, error: insertError } = await supabase
      .from('elections')
      .insert({
        title: validatedData.title,
        type: validatedData.type,
        description: validatedData.description,
        start_time: validatedData.start_time,
        end_time: validatedData.end_time,
        eligible_voter_categories: validatedData.eligible_voter_categories,
        status: validatedData.status,
        created_by: user.id,
      })
      .select('id, title')
      .single()

    if (insertError) {
      return {
        success: false,
        error: `Database error: ${insertError.message}`,
      }
    }

    return {
      success: true,
      data: {
        id: election.id,
        title: election.title,
      },
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

interface ElectionActionResponse {
  success: boolean
  error?: string
}

export async function publishElection(electionId: string): Promise<ElectionActionResponse> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized: User not authenticated',
      }
    }

    // Verify admin permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      return {
        success: false,
        error: 'Unauthorized: Only admins can publish elections',
      }
    }

    // A published draft moves to "scheduled" and waits for start_time
    const { error: updateError } = await supabase
      .from('elections')
      .update({ status: 'scheduled' })
      .eq('id', electionId)
      .eq('status', 'draft')

    if (updateError) {
      return {
        success: false,
        error: `Failed to publish: ${updateError.message}`,
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

export async function closeElection(electionId: string): Promise<ElectionActionResponse> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: User not authenticated' }
    }

    // Verify admin permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      return { success: false, error: 'Unauthorized: Only admins can close elections' }
    }

    // Update election status to closed
    const { error: updateError } = await supabase
      .from('elections')
      .update({ status: 'closed' })
      .eq('id', electionId)
      .eq('status', 'active')

    if (updateError) {
      return { success: false, error: `Failed to close: ${updateError.message}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
