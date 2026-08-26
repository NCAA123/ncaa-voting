'use server'

// Thin Server Action wrappers around lib/supabase/voting-queries so client
// components can call these reads without importing that module directly --
// it pulls in lib/supabase/server, which uses next/headers and can't be
// bundled into client code.

import {
  getReceiptByHash as _getReceiptByHash,
  getCandidatesForPosition as _getCandidatesForPosition,
  getVotesTrendByHour as _getVotesTrendByHour,
  getZoneParticipation as _getZoneParticipation,
  getAuditLogs as _getAuditLogs,
} from '@/lib/supabase/voting-queries'

export async function getReceiptByHash(receiptHash: string) {
  return _getReceiptByHash(receiptHash)
}

export async function getCandidatesForPosition(positionId: string) {
  return _getCandidatesForPosition(positionId)
}

export async function getVotesTrendByHour(electionId: string) {
  return _getVotesTrendByHour(electionId)
}

export async function getZoneParticipation(electionId: string) {
  return _getZoneParticipation(electionId)
}

export async function getAuditLogs(
  electionId: string,
  filters?: { action?: string; startDate?: string; endDate?: string }
) {
  return _getAuditLogs(electionId, filters)
}
