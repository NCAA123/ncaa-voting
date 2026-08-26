'use server'

import { createClient } from '@/lib/supabase/server'
import {
  approveCandidateSchema,
  rejectCandidateSchema,
  type ApproveCandidateInput,
  type RejectCandidateInput,
} from '@/lib/validations/candidates'
import { nominateCandidateSchema, photoUploadSchema } from '@/lib/validations/nomination'
import { getCandidateDocuments } from '@/lib/supabase/queries'

interface ActionResponse {
  success: boolean
  error?: string
}

// Thin Server Action wrapper so client components (e.g. the candidate
// approval queue) can fetch documents on demand without importing
// lib/supabase/queries directly -- that module uses next/headers via
// lib/supabase/server, which client bundles can't include.
export async function getCandidateDocumentsAction(candidateId: string) {
  return getCandidateDocuments(candidateId)
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

export async function approveCandidate(input: ApproveCandidateInput): Promise<ActionResponse> {
  try {
    const validatedData = approveCandidateSchema.parse(input)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const isAdmin = await checkAdminPermissions(supabase, user.id)
    if (!isAdmin) {
      return { success: false, error: 'Only admins can approve candidates' }
    }

    const { error } = await supabase
      .from('candidates')
      .update({ status: 'approved' })
      .eq('id', validatedData.candidate_id)
      .eq('election_id', validatedData.election_id)

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

export async function rejectCandidate(input: RejectCandidateInput): Promise<ActionResponse> {
  try {
    const validatedData = rejectCandidateSchema.parse(input)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const isAdmin = await checkAdminPermissions(supabase, user.id)
    if (!isAdmin) {
      return { success: false, error: 'Only admins can reject candidates' }
    }

    const { error } = await supabase
      .from('candidates')
      .update({
        status: 'rejected',
        rejection_reason: validatedData.rejection_reason,
      })
      .eq('id', validatedData.candidate_id)
      .eq('election_id', validatedData.election_id)

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

// Search members by name or email to nominate as a candidate. profiles is
// readable by any authenticated user (profiles_select_all_authenticated),
// so this doesn't need an admin check of its own -- the nominate page it's
// used from is already behind the /admin/** middleware gate.
export async function searchMembers(query: string) {
  if (!query || query.trim().length < 2) return []

  const supabase = await createClient()
  const term = query.trim()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, zone, arbiter_level, avatar_url')
    .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
    .limit(10)

  if (error) {
    console.error('Error searching members:', error)
    return []
  }

  return data || []
}

export async function nominateCandidate(
  formData: FormData,
  input: {
    electionId: string
    positionId: string
    candidateUserId: string
    bio: string
    manifesto: string
    fideTitle?: string
    achievements?: string
    videoUrl?: string
    socialLinks?: {
      twitter?: string
      linkedin?: string
      facebook?: string
    }
  }
): Promise<ActionResponse & { candidateId?: string }> {
  try {
    // Validate form input
    const validatedInput = nominateCandidateSchema.parse(input)
    const supabase = await createClient()

    // Get current user (the admin doing the nominating)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized: User not authenticated' }
    }

    const isAdmin = await checkAdminPermissions(supabase, user.id)
    if (!isAdmin) {
      return { success: false, error: 'Only admins can nominate candidates' }
    }

    // Get the nominated member's own profile (name/zone belong to them,
    // not to the admin submitting the nomination)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, zone')
      .eq('id', validatedInput.candidateUserId)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'Selected member not found' }
    }

    // Get photo file from FormData
    const photoFile = formData.get('photo') as File | null
    let photoUrl = null

    if (photoFile) {
      try {
        const photoValidation = photoUploadSchema.parse({ file: photoFile })

        // Upload to Supabase Storage
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${validatedInput.candidateUserId}-${Date.now()}.${fileExt}`
        const storagePath = `${input.electionId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('candidate-photos')
          .upload(storagePath, photoFile)

        if (uploadError) {
          return { success: false, error: `Photo upload failed: ${uploadError.message}` }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('candidate-photos')
          .getPublicUrl(storagePath)

        photoUrl = urlData.publicUrl
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Photo validation failed',
        }
      }
    }

    // Insert candidate
    const { data: candidate, error: insertError } = await supabase
      .from('candidates')
      .insert({
        user_id: validatedInput.candidateUserId,
        election_id: input.electionId,
        position_id: input.positionId,
        bio: validatedInput.bio,
        manifesto: validatedInput.manifesto,
        fide_title: validatedInput.fideTitle || null,
        achievements: validatedInput.achievements || null,
        photo_url: photoUrl,
        video_url: validatedInput.videoUrl || null,
        zone: profile.zone,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError) {
      return { success: false, error: `Failed to create candidate: ${insertError.message}` }
    }

    return {
      success: true,
      candidateId: candidate.id
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function toggleBookmark(
  candidateId: string
): Promise<ActionResponse & { isBookmarked?: boolean }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized: User not authenticated' }
    }

    // Check if bookmark exists
    const { data: existingBookmark, error: checkError } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('candidate_id', candidateId)
      .maybeSingle()

    if (checkError) {
      return { success: false, error: `Failed to check bookmark: ${checkError.message}` }
    }

    if (existingBookmark) {
      // Delete bookmark
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', existingBookmark.id)

      if (deleteError) {
        return { success: false, error: `Failed to remove bookmark: ${deleteError.message}` }
      }

      return { success: true, isBookmarked: false }
    } else {
      // Create bookmark
      const { error: insertError } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          candidate_id: candidateId,
        })

      if (insertError) {
        return { success: false, error: `Failed to add bookmark: ${insertError.message}` }
      }

      return { success: true, isBookmarked: true }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
