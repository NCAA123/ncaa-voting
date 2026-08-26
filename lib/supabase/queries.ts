import { createClient } from '@/lib/supabase/server'
import { Election } from '@/types/elections'

export async function getElections(): Promise<Election[]> {
  try {
    const supabase = await createClient()
    const { data: elections, error } = await supabase
      .from('elections')
      .select(`
        *,
        positions:positions(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching elections:', error)
      return []
    }

    // Add positions count to each election
    return (elections || []).map((election: any) => ({
      ...election,
      positions_count: election.positions?.[0]?.count || 0,
    }))
  } catch (error) {
    console.error('Error in getElections:', error)
    return []
  }
}

export async function getElectionById(id: string): Promise<Election | null> {
  try {
    const supabase = await createClient()
    const { data: election, error } = await supabase
      .from('elections')
      .select(`
        *,
        positions:positions(count)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching election:', error)
      return null
    }

    return {
      ...election,
      positions_count: election.positions?.[0]?.count || 0,
    }
  } catch (error) {
    console.error('Error in getElectionById:', error)
    return null
  }
}

export async function getPositions(electionId: string): Promise<any[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('positions')
      .select(`
        id,
        title,
        max_votes,
        display_order,
        election_id,
        created_at,
        candidates:candidates(count)
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
    console.error('Error in getPositions:', error)
    return []
  }
}

export async function getCandidates(
  electionId: string,
  status?: 'pending' | 'approved' | 'rejected'
): Promise<any[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('candidates')
      .select(`
        id,
        user_id,
        election_id,
        position_id,
        status,
        zone,
        fide_title,
        rejection_reason,
        created_at,
        positions(id, title),
        profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('election_id', electionId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching candidates:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getCandidates:', error)
    return []
  }
}

export async function getCandidateDocuments(candidateId: string): Promise<any[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('candidate_documents')
      .select('id, file_url, doc_type, verified, created_at')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching candidate documents:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getCandidateDocuments:', error)
    return []
  }
}

export async function getCandidateById(candidateId: string, userId?: string): Promise<any | null> {
  try {
    const supabase = await createClient()
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select(`
        id,
        user_id,
        election_id,
        position_id,
        status,
        bio,
        manifesto,
        achievements,
        photo_url,
        video_url,
        zone,
        fide_title,
        created_at,
        positions(id, title),
        profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('id', candidateId)
      .eq('status', 'approved')
      .single()

    if (error) {
      console.error('Error fetching candidate:', error)
      return null
    }

    // Check if user has bookmarked this candidate
    let isBookmarked = false
    if (userId) {
      const { data: bookmark } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('candidate_id', candidateId)
        .maybeSingle()

      isBookmarked = !!bookmark
    }

    return {
      ...candidate,
      isBookmarked,
    }
  } catch (error) {
    console.error('Error in getCandidateById:', error)
    return null
  }
}

export async function getComparisonCandidates(candidateIds: string[]): Promise<any[]> {
  try {
    if (!candidateIds || candidateIds.length === 0) {
      return []
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('candidates')
      .select(`
        id,
        bio,
        achievements,
        photo_url,
        zone,
        fide_title,
        status,
        positions(id, title),
        profiles(id, first_name, last_name)
      `)
      .in('id', candidateIds)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching comparison candidates:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getComparisonCandidates:', error)
    return []
  }
}
