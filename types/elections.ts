/**
 * NCAA Voting Module - TypeScript Type Definitions
 * Matches the Supabase database schema for voting system
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum ElectionType {
  GENERAL = "general",
  SPECIAL = "special",
  RUNOFF = "runoff",
  ZONAL = "zonal",
  COMMITTEE = "committee",
  REFERENDUM = "referendum",
  POLL = "poll",
}

export enum ElectionStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  ACTIVE = "active",
  CLOSED = "closed",
  ARCHIVED = "archived",
}

export enum CandidateStatus {
  NOMINATED = "nominated",
  APPROVED = "approved",
  DISQUALIFIED = "disqualified",
  WITHDREW = "withdrew",
}

export enum ArbiterRole {
  MEMBER = "member",
  ADMIN = "admin",
  SUPERADMIN = "superadmin",
}

export enum DocumentType {
  CV = "cv",
  QUALIFICATION = "qualification",
  RECOMMENDATION = "recommendation",
  OTHER = "other",
}

export enum AuditAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  VOTE = "vote",
  VERIFY = "verify",
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

/**
 * Elections Table
 * Main election record containing overall election information
 */
export interface Election {
  id: string;
  title: string;
  description: string | null;
  type: ElectionType;
  status: ElectionStatus;
  start_time: string | null; // ISO 8601 timestamp
  end_time: string | null; // ISO 8601 timestamp
  eligible_voter_categories: string[];
  created_by: string; // arbiter_id
  zone_id: string | null;
  results_released: boolean;
  results_released_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Positions Table
 * Positions available in an election (e.g., President, Vice President)
 */
export interface Position {
  id: string;
  election_id: string;
  title: string;
  description: string | null;
  num_seats: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/**
 * Candidates Table
 * Candidates running for positions
 */
export interface Candidate {
  id: string;
  position_id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  status: CandidateStatus;
  votes_received: number;
  created_at: string;
  updated_at: string;
}

/**
 * Votes Table
 * Individual votes cast by arbiters
 * Privacy: voter_id_hash is stored, actual voter_id never stored
 */
export interface Vote {
  id: string;
  election_id: string;
  position_id: string;
  candidate_id: string;
  voter_id_hash: string; // Hash of voter's arbiter_id for privacy
  vote_hash: string; // Hash of vote for receipt verification
  cast_at: string;
  created_at: string;
}

/**
 * Vote Receipts Table
 * Anonymous receipts given to voters for verification
 * Allows voter to verify their vote was counted without revealing how they voted
 */
export interface VoteReceipt {
  id: string;
  election_id: string;
  receipt_code: string; // Unique anonymous receipt code
  voter_id_hash: string; // Hash of voter's arbiter_id
  vote_hashes: string[]; // Array of vote hashes for their votes
  created_at: string;
  verified_at: string | null;
}

/**
 * Vote Audit Log Table
 * Admin-only audit trail for all voting activity
 * Privacy: voter information is hashed
 */
export interface VoteAuditLog {
  id: string;
  election_id: string;
  action: AuditAction;
  user_id: string; // Admin/auditor who performed action
  voter_id_hash: string | null; // Hash of affected voter (if applicable)
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Candidate Documents Table
 * Supporting documents for candidates (CV, recommendations, etc.)
 */
export interface CandidateDocument {
  id: string;
  candidate_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string;
  file_size: number;
  is_verified: boolean;
  verified_by: string | null; // Admin who verified
  created_at: string;
  updated_at: string;
}

/**
 * Election Announcements Table
 * Announcements posted during an election
 */
export interface ElectionAnnouncement {
  id: string;
  election_id: string;
  title: string;
  content: string;
  posted_by: string; // Admin/creator arbiter_id
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Bookmarks Table
 * Arbiters can bookmark candidates or elections for quick access
 */
export interface Bookmark {
  id: string;
  arbiter_id: string;
  election_id: string | null;
  candidate_id: string | null;
  created_at: string;
}

// ============================================================================
// VIEW/QUERY RESPONSE TYPES
// ============================================================================

/**
 * Full Election Details with nested relations
 */
export interface ElectionWithDetails extends Election {
  positions: (Position & {
    candidates: (Candidate & {
      documents: CandidateDocument[];
    })[];
  })[];
  announcements: ElectionAnnouncement[];
  total_votes: number;
  total_voters: number;
}

/**
 * Position with candidates
 */
export interface PositionWithCandidates extends Position {
  candidates: (Candidate & {
    documents: CandidateDocument[];
    votes_received: number;
  })[];
}

/**
 * Candidate with documents
 */
export interface CandidateWithDocuments extends Candidate {
  documents: CandidateDocument[];
}

/**
 * Vote response with decoded information
 */
export interface VoteResponse {
  id: string;
  election_id: string;
  position_id: string;
  candidate_id: string;
  cast_at: string;
  receipt_code?: string; // For voter's personal receipt
}

/**
 * Election results/statistics
 */
export interface ElectionResults {
  election_id: string;
  position_id: string;
  candidates: {
    id: string;
    name: string;
    votes_received: number;
    percentage: number;
  }[];
  total_votes: number;
  total_eligible_voters: number;
  turnout_percentage: number;
}

// ============================================================================
// REQUEST/MUTATION TYPES
// ============================================================================

/**
 * Request body for creating an election
 */
export interface CreateElectionInput {
  title: string;
  description?: string;
  election_type: ElectionType;
  start_date: string;
  end_date: string;
  allow_revote: boolean;
  max_votes_per_position: number;
  positions: CreatePositionInput[];
}

/**
 * Request body for creating a position
 */
export interface CreatePositionInput {
  title: string;
  description?: string;
  num_seats: number;
  order_index: number;
  candidates?: CreateCandidateInput[];
}

/**
 * Request body for creating a candidate
 */
export interface CreateCandidateInput {
  name: string;
  bio?: string;
  avatar_url?: string;
  documents?: {
    document_type: DocumentType;
    file_url: string;
    file_name: string;
    file_size: number;
  }[];
}

/**
 * Request body for casting a vote
 */
export interface CastVoteInput {
  election_id: string;
  position_id: string;
  candidate_id: string;
}

/**
 * Batch vote submission
 */
export interface CastVotesInput {
  election_id: string;
  votes: CastVoteInput[];
}

/**
 * Request to verify vote receipt
 */
export interface VerifyReceiptInput {
  receipt_code: string;
  vote_hashes: string[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * List response with pagination
 */
export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Authentication context for voting
 */
export interface VoterContext {
  arbiter_id: string;
  role: ArbiterRole;
  email: string;
  is_authenticated: boolean;
}

/**
 * Vote hash verification result
 */
export interface VoteVerification {
  valid: boolean;
  found: boolean;
  election_id?: string;
  position_id?: string;
  candidate_id?: string;
}
