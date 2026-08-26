import { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

// candidates.user_id FKs to auth.users, not public.profiles -- no direct FK
// exists between candidates and profiles, so PostgREST can't auto-embed
// profiles(...) from a candidates query (it fails and returns []). Fetch
// separately and merge instead. See lib/supabase/queries.ts's attachProfiles
// for the same fix on the other candidate-listing queries.
async function attachProfiles<T extends { user_id: string }>(
  supabase: SupabaseClient,
  rows: T[],
  fields: string
): Promise<(T & { profiles: any })[]> {
  if (rows.length === 0) return []

  const userIds = [...new Set(rows.map((r) => r.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select(fields)
    .in('id', userIds)

  const byId = new Map((profiles || []).map((p: any) => [p.id, p]))
  return rows.map((row) => ({ ...row, profiles: byId.get(row.user_id) || null }))
}

export async function getElectionsForVoter(userId: string): Promise<any[]> {
  try {
    const supabase = await createClient()

    // Get voter's zone and arbiter level
    const { data: voterProfile, error: profileError } = await supabase
      .from('profiles')
      .select('zone, arbiter_level')
      .eq('id', userId)
      .single()

    if (profileError || !voterProfile) {
      console.error('Error fetching voter profile:', profileError)
      return []
    }

    // Get all elections where voter is eligible
    const { data: elections, error: electionsError } = await supabase
      .from('elections')
      .select(`
        id,
        title,
        type,
        status,
        description,
        start_time,
        end_time,
        eligible_voter_categories,
        positions(count)
      `)
      .order('start_time', { ascending: false })

    if (electionsError) {
      console.error('Error fetching elections:', electionsError)
      return []
    }

    // Filter elections by eligibility
    const eligibleElections = (elections || []).filter((election) => {
      const categories = election.eligible_voter_categories || []
      return (
        categories.includes(voterProfile.zone) ||
        categories.includes(voterProfile.arbiter_level) ||
        categories.length === 0 // No restrictions = everyone eligible
      )
    })

    // Check if voter has already voted in each election
    const electionsWithVoteStatus = await Promise.all(
      eligibleElections.map(async (election) => {
        const { data: vote } = await supabase
          .from('votes')
          .select('id')
          .eq('voter_id', userId)
          .eq('election_id', election.id)
          .maybeSingle()

        return {
          ...election,
          positions_count: election.positions?.[0]?.count || 0,
          hasVoted: !!vote,
        }
      })
    )

    return electionsWithVoteStatus
  } catch (error) {
    console.error('Error in getElectionsForVoter:', error)
    return []
  }
}

export async function getElectionPositions(electionId: string): Promise<any[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('positions')
      .select(`
        id,
        title,
        max_votes,
        display_order,
        candidates(count)
      `)
      .eq('election_id', electionId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching positions:', error)
      return []
    }

    return (data || []).map((pos: any) => ({
      ...pos,
      candidates_count: pos.candidates?.[0]?.count || 0,
    }))
  } catch (error) {
    console.error('Error in getElectionPositions:', error)
    return []
  }
}

export async function getCandidatesForPosition(positionId: string): Promise<any[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('candidates')
      .select(`
        id,
        user_id,
        bio,
        photo_url,
        zone,
        fide_title,
        positions(id, title)
      `)
      .eq('position_id', positionId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching candidates:', error)
      return []
    }

    return attachProfiles(supabase, data || [], 'id, first_name, last_name, avatar_url')
  } catch (error) {
    console.error('Error in getCandidatesForPosition:', error)
    return []
  }
}

export async function checkVotingEligibility(
  userId: string,
  electionId: string
): Promise<{ eligible: boolean; reason?: string }> {
  try {
    const supabase = await createClient()

    // Get voter profile
    const { data: voterProfile, error: profileError } = await supabase
      .from('profiles')
      .select('zone, arbiter_level')
      .eq('id', userId)
      .single()

    if (profileError || !voterProfile) {
      return { eligible: false, reason: 'Profile not found' }
    }

    // Get election details
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('id, status, start_time, end_time, eligible_voter_categories')
      .eq('id', electionId)
      .single()

    if (electionError || !election) {
      return { eligible: false, reason: 'Election not found' }
    }

    // Check election is active
    if (election.status !== 'active') {
      return { eligible: false, reason: 'Election is not currently active' }
    }

    // Check if already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('voter_id', userId)
      .eq('election_id', electionId)
      .maybeSingle()

    if (existingVote) {
      return { eligible: false, reason: 'You have already voted in this election' }
    }

    // Check eligibility categories
    const categories = election.eligible_voter_categories || []
    const isEligible =
      categories.length === 0 ||
      categories.includes(voterProfile.zone) ||
      categories.includes(voterProfile.arbiter_level)

    if (!isEligible) {
      return {
        eligible: false,
        reason: 'Your zone or arbiter level is not eligible for this election',
      }
    }

    return { eligible: true }
  } catch (error) {
    console.error('Error in checkVotingEligibility:', error)
    return { eligible: false, reason: 'An error occurred' }
  }
}

export async function getVoterVoteCount(userId: string, electionId: string): Promise<number> {
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('voter_id', userId)
      .eq('election_id', electionId)

    if (error) {
      console.error('Error counting votes:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getVoterVoteCount:', error)
    return 0
  }
}

export async function getReceiptByHash(receiptHash: string): Promise<any | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vote_receipts')
      .select(`
        id,
        receipt_hash,
        created_at,
        vote_count,
        elections(id, title, type)
      `)
      .eq('receipt_hash', receiptHash)
      .maybeSingle()

    if (error) {
      console.error('Error fetching receipt:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getReceiptByHash:', error)
    return null
  }
}

export async function getReceiptById(receiptId: string): Promise<any | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vote_receipts')
      .select(`
        id,
        receipt_hash,
        created_at,
        vote_count,
        elections(id, title, type)
      `)
      .eq('id', receiptId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching receipt:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getReceiptById:', error)
    return null
  }
}

export async function getElectionResults(electionId: string): Promise<any> {
  try {
    const supabase = await createClient()

    // Fetch all votes with candidate and position details. candidates.user_id
    // has no direct FK to profiles (see attachProfiles above), so profile
    // names are fetched separately below rather than embedded here.
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select(`
        id,
        position_id,
        candidate_id,
        positions(id, title, max_votes),
        candidates(id, bio, photo_url, user_id)
      `)
      .eq('election_id', electionId)

    if (votesError) {
      console.error('Error fetching votes:', votesError)
      return {}
    }

    if (!votes || votes.length === 0) {
      return {}
    }

    const candidateUserIds = [...new Set(votes.map((v) => v.candidates?.user_id).filter(Boolean))]
    const { data: candidateProfiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', candidateUserIds)
    const profileById = new Map((candidateProfiles || []).map((p) => [p.id, p]))

    // Group votes by position
    const results: Record<string, any> = {}

    for (const vote of votes) {
      const positionId = vote.position_id
      const positionTitle = vote.positions?.title || 'Unknown'
      const candidateId = vote.candidate_id
      const candidateProfile = vote.candidates?.user_id ? profileById.get(vote.candidates.user_id) : null
      const candidateName = candidateProfile
        ? `${candidateProfile.first_name} ${candidateProfile.last_name}`
        : 'Unknown'

      if (!results[positionId]) {
        results[positionId] = {
          id: positionId,
          title: positionTitle,
          max_votes: vote.positions?.max_votes || 1,
          candidates: {},
          totalVotes: 0,
        }
      }

      if (!results[positionId].candidates[candidateId]) {
        results[positionId].candidates[candidateId] = {
          id: candidateId,
          name: candidateName,
          photoUrl: vote.candidates?.photo_url,
          voteCount: 0,
        }
      }

      results[positionId].candidates[candidateId].voteCount += 1
      results[positionId].totalVotes += 1
    }

    // Convert to array and calculate percentages
    const resultsArray = Object.values(results).map((position: any) => ({
      ...position,
      candidates: Object.values(position.candidates).map((candidate: any) => ({
        ...candidate,
        percentage: position.totalVotes > 0 ? ((candidate.voteCount / position.totalVotes) * 100).toFixed(2) : '0',
      })),
    }))

    return resultsArray
  } catch (error) {
    console.error('Error in getElectionResults:', error)
    return {}
  }
}

/**
 * Counts members matching an election's eligible_voter_categories (zone or
 * arbiter_level). elections has no stored eligible-voter count -- category
 * membership can change over time, so this is computed live rather than
 * cached on the row.
 */
async function countEligibleVoters(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eligibleVoterCategories: string[]
): Promise<number> {
  if (!eligibleVoterCategories || eligibleVoterCategories.length === 0) {
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    return count || 0
  }

  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .or(
      `zone.in.(${eligibleVoterCategories.join(',')}),arbiter_level.in.(${eligibleVoterCategories.join(',')})`
    )

  return count || 0
}

export async function getTurnoutStats(electionId: string): Promise<{
  totalVotes: number
  eligibleVoters: number
  turnoutPercentage: number
}> {
  try {
    const supabase = await createClient()

    // Count unique voters who voted
    const { count: totalVotes, error: receiptsError } = await supabase
      .from('vote_receipts')
      .select('id', { count: 'exact', head: true })
      .eq('election_id', electionId)

    if (receiptsError) {
      console.error('Error fetching vote receipts:', receiptsError)
      return { totalVotes: 0, eligibleVoters: 0, turnoutPercentage: 0 }
    }

    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('eligible_voter_categories')
      .eq('id', electionId)
      .single()

    if (electionError || !election) {
      console.error('Error fetching election:', electionError)
      return { totalVotes: totalVotes || 0, eligibleVoters: 0, turnoutPercentage: 0 }
    }

    const eligibleVoters = await countEligibleVoters(supabase, election.eligible_voter_categories || [])
    const votes = totalVotes || 0
    const turnoutPercentage = eligibleVoters > 0 ? (votes / eligibleVoters) * 100 : 0

    return {
      totalVotes: votes,
      eligibleVoters,
      turnoutPercentage: parseFloat(turnoutPercentage.toFixed(2)),
    }
  } catch (error) {
    console.error('Error in getTurnoutStats:', error)
    return { totalVotes: 0, eligibleVoters: 0, turnoutPercentage: 0 }
  }
}

export async function getVotesTrendByHour(electionId: string): Promise<Array<{
  hour: string
  count: number
}>> {
  try {
    const supabase = await createClient()
    const { data: votes, error } = await supabase
      .from('votes')
      .select('created_at')
      .eq('election_id', electionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching votes trend:', error)
      return []
    }

    if (!votes || votes.length === 0) {
      return []
    }

    // Group by hour
    const hourMap = new Map<string, number>()
    for (const vote of votes) {
      const date = new Date(vote.created_at)
      const hour = `${date.getHours()}:00`
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
    }

    return Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
  } catch (error) {
    console.error('Error in getVotesTrendByHour:', error)
    return []
  }
}

export async function getZoneParticipation(electionId: string): Promise<Array<{
  zone: string
  votes: number
}>> {
  try {
    const supabase = await createClient()
    const { data: votes, error } = await supabase
      .from('votes')
      .select('candidates(zone)')
      .eq('election_id', electionId)

    if (error) {
      console.error('Error fetching zone participation:', error)
      return []
    }

    if (!votes || votes.length === 0) {
      return []
    }

    // Group by zone
    const zoneMap = new Map<string, number>()
    for (const vote of votes) {
      const zone = vote.candidates?.zone || 'Unknown'
      zoneMap.set(zone, (zoneMap.get(zone) || 0) + 1)
    }

    return Array.from(zoneMap.entries())
      .map(([zone, votes]) => ({ zone, votes }))
      .sort((a, b) => b.votes - a.votes)
  } catch (error) {
    console.error('Error in getZoneParticipation:', error)
    return []
  }
}

export async function getAuditLogs(
  electionId: string,
  filters?: {
    action?: string
    startDate?: string
    endDate?: string
  }
): Promise<any[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('vote_audit_log')
      .select('id, created_at:timestamp, action, voter_id_hashed, ip_address')
      .eq('election_id', electionId)

    // Apply action filter
    if (filters?.action) {
      query = query.eq('action', filters.action)
    }

    // Apply date range filters
    if (filters?.startDate) {
      query = query.gte('timestamp', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('timestamp', filters.endDate)
    }

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Error fetching audit logs:', error)
      return []
    }

    // Anonymize data for display
    return (data || []).map((log: any) => ({
      ...log,
      displayVoterId: log.voter_id_hashed ? `${log.voter_id_hashed.substring(0, 8)}...` : 'Unknown',
      displayIpAddress: maskIpAddress(log.ip_address),
    }))
  } catch (error) {
    console.error('Error in getAuditLogs:', error)
    return []
  }
}

function maskIpAddress(ip: string | null): string {
  if (!ip) return 'Unknown'
  const parts = ip.split('.')
  if (parts.length !== 4) return ip
  return `${parts[0]}.${parts[1]}.${parts[2]}.*`
}

export async function getElectionStats(electionId: string): Promise<{
  totalEligibleVoters: number
  votesCast: number
  turnoutPercentage: number
  candidateStats: {
    approved: number
    pending: number
    rejected: number
  }
  timeRemaining: string
}> {
  try {
    const supabase = await createClient()

    // Get election details
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('eligible_voter_categories, end_time')
      .eq('id', electionId)
      .single()

    if (electionError || !election) {
      console.error('Error fetching election:', electionError)
      return {
        totalEligibleVoters: 0,
        votesCast: 0,
        turnoutPercentage: 0,
        candidateStats: { approved: 0, pending: 0, rejected: 0 },
        timeRemaining: '',
      }
    }

    // Get votes cast count
    const { count: votesCast, error: votesError } = await supabase
      .from('vote_receipts')
      .select('id', { count: 'exact', head: true })
      .eq('election_id', electionId)

    if (votesError) {
      console.error('Error counting votes:', votesError)
    }

    // Get candidate counts by status
    const { data: candidateCounts, error: candidatesError } = await supabase
      .from('candidates')
      .select('status')
      .eq('election_id', electionId)

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError)
    }

    const candidateStats = {
      approved: candidateCounts?.filter(c => c.status === 'approved').length || 0,
      pending: candidateCounts?.filter(c => c.status === 'pending').length || 0,
      rejected: candidateCounts?.filter(c => c.status === 'rejected').length || 0,
    }

    // Calculate time remaining
    const endTime = election.end_time ? new Date(election.end_time) : null
    const now = new Date()

    let timeRemaining = ''
    if (!endTime) {
      timeRemaining = 'No end time set'
    } else {
      const diffMs = endTime.getTime() - now.getTime()
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 0) {
        timeRemaining = 'Election ended'
      } else if (diffMins < 60) {
        timeRemaining = `${diffMins} minutes`
      } else {
        const diffHours = Math.floor(diffMins / 60)
        timeRemaining = `${diffHours}h ${diffMins % 60}m`
      }
    }

    const totalEligible = await countEligibleVoters(supabase, election.eligible_voter_categories || [])
    const votes = votesCast || 0
    const turnout = totalEligible > 0 ? (votes / totalEligible) * 100 : 0

    return {
      totalEligibleVoters: totalEligible,
      votesCast: votes,
      turnoutPercentage: parseFloat(turnout.toFixed(2)),
      candidateStats,
      timeRemaining,
    }
  } catch (error) {
    console.error('Error in getElectionStats:', error)
    return {
      totalEligibleVoters: 0,
      votesCast: 0,
      turnoutPercentage: 0,
      candidateStats: { approved: 0, pending: 0, rejected: 0 },
      timeRemaining: '',
    }
  }
}
