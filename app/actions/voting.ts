'use server'

import crypto from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import {
  checkEligibilitySchema,
  submitVoteSchema,
  type CheckEligibilityInput,
  type SubmitVoteInput,
} from '@/lib/validations/voting'
import { checkVotingEligibility, getElectionPositions } from '@/lib/supabase/voting-queries'

interface ActionResponse {
  success: boolean
  error?: string
  data?: any
}

function hashVoterId(userId: string): string {
  const salt = process.env.VOTE_HASH_SALT || ''
  return crypto.createHash('sha256').update(`${salt}:${userId}`).digest('hex')
}

export async function checkEligibility(
  input: CheckEligibilityInput
): Promise<ActionResponse> {
  try {
    const validatedInput = checkEligibilitySchema.parse(input)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized: User not authenticated' }
    }

    const eligibility = await checkVotingEligibility(user.id, validatedInput.electionId)

    if (!eligibility.eligible) {
      return {
        success: false,
        error: eligibility.reason || 'You are not eligible to vote in this election',
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

export async function confirmAndStoreVotes(
  input: SubmitVoteInput
): Promise<ActionResponse & { receiptHash?: string }> {
  try {
    const validatedInput = submitVoteSchema.parse(input)
    const supabase = await createClient()

    // Get current user -- the ballot page is already behind the auth
    // middleware, so this is just a normal signed-in session, not a
    // separate re-authentication step.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized: User not authenticated' }
    }

    // Check for duplicate votes (user already voted in this election)
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('voter_id', user.id)
      .eq('election_id', validatedInput.electionId)
      .limit(1)
      .maybeSingle()

    if (existingVote) {
      return { success: false, error: 'You have already voted in this election' }
    }

    // Verify eligibility one more time
    const eligibility = await checkVotingEligibility(user.id, validatedInput.electionId)
    if (!eligibility.eligible) {
      return { success: false, error: 'You are not eligible to vote' }
    }

    // Get election and positions to validate selections
    const positions = await getElectionPositions(validatedInput.electionId)
    if (positions.length === 0) {
      return { success: false, error: 'Invalid election or no positions found' }
    }

    // Validate vote selections and build vote records. Each vote_hash
    // includes voter_id so two different voters picking the same
    // candidate never collide on votes.vote_hash's UNIQUE constraint.
    const votes: Array<{
      election_id: string
      position_id: string
      candidate_id: string
      voter_id: string
      vote_hash: string
    }> = []

    for (const position of positions) {
      const selectedCandidateIds = validatedInput.draftSelections[position.id] || []

      if (selectedCandidateIds.length > position.max_votes) {
        return {
          success: false,
          error: `Too many votes for position "${position.title}" (max: ${position.max_votes})`,
        }
      }

      for (const candidateId of selectedCandidateIds) {
        const voteData = `${user.id}:${position.id}:${candidateId}`
        const hash = crypto.createHash('sha256').update(voteData).digest('hex')

        votes.push({
          election_id: validatedInput.electionId,
          position_id: position.id,
          candidate_id: candidateId,
          voter_id: user.id,
          vote_hash: hash,
        })
      }
    }

    if (votes.length === 0) {
      return { success: false, error: 'No votes to submit' }
    }

    // Insert votes
    const { error: insertError } = await supabase
      .from('votes')
      .insert(votes)

    if (insertError) {
      console.error('Vote insertion error:', insertError)
      return {
        success: false,
        error: `Failed to submit vote: ${insertError.message}`,
      }
    }

    // Receipt hash proves a vote was cast without revealing its content
    const receiptHash = crypto
      .createHash('sha256')
      .update(`${user.id}:${validatedInput.electionId}:${Date.now()}`)
      .digest('hex')

    const voterHash = hashVoterId(user.id)

    // Create vote receipt
    const { data: receipt, error: receiptError } = await supabase
      .from('vote_receipts')
      .insert({
        voter_id: user.id,
        election_id: validatedInput.electionId,
        receipt_hash: receiptHash,
        vote_count: votes.length,
      })
      .select('id, created_at')
      .single()

    if (receiptError) {
      console.error('Vote receipt error:', receiptError)
    }

    // Create audit log entry
    await supabase.from('vote_audit_log').insert({
      election_id: validatedInput.electionId,
      voter_id_hashed: voterHash,
      action: 'vote_cast',
      details: { vote_count: votes.length },
    })

    return {
      success: true,
      receiptHash,
      data: {
        receiptId: receipt?.id,
        timestamp: receipt?.created_at || new Date().toISOString(),
        voteCount: votes.length,
      },
    }
  } catch (error) {
    console.error('Vote confirmation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function releaseResults(electionId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

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
      return { success: false, error: 'Only admins can release results' }
    }

    const { error: updateError } = await supabase
      .from('elections')
      .update({ results_released: true, results_released_at: new Date().toISOString() })
      .eq('id', electionId)
      .eq('status', 'closed')

    if (updateError) {
      return { success: false, error: `Failed to release results: ${updateError.message}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
