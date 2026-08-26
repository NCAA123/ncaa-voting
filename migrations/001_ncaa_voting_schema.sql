-- NCAA Voting System Schema Migration
-- Complete migration with all tables, enums, RLS policies, and indexes

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE election_type AS ENUM ('general', 'special', 'runoff', 'zonal', 'committee', 'referendum', 'poll');
CREATE TYPE election_status AS ENUM ('draft', 'scheduled', 'active', 'closed', 'archived');
CREATE TYPE candidate_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');
CREATE TYPE arbiter_role AS ENUM ('member', 'admin', 'superadmin');
CREATE TYPE document_type AS ENUM ('cv', 'credentials', 'manifesto', 'nomination', 'other');
CREATE TYPE audit_action AS ENUM ('vote_cast', 'vote_verified', 'receipt_generated', 'anomaly_detected', 'admin_action');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Elections table
CREATE TABLE IF NOT EXISTS elections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title varchar(255) NOT NULL,
  type election_type NOT NULL DEFAULT 'general',
  description text,
  status election_status NOT NULL DEFAULT 'draft',
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  eligible_voter_categories text[] DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  zone_id uuid,
  results_released boolean NOT NULL DEFAULT false,
  results_released_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT election_dates_valid CHECK (end_time IS NULL OR start_time IS NULL OR start_time < end_time)
);

CREATE INDEX idx_elections_status ON elections(status);
CREATE INDEX idx_elections_created_by ON elections(created_by);
CREATE INDEX idx_elections_zone_id ON elections(zone_id);

-- Positions table (roles/seats within an election)
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  max_votes int NOT NULL DEFAULT 1,
  display_order int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT max_votes_positive CHECK (max_votes > 0)
);

CREATE INDEX idx_positions_election_id ON positions(election_id);
CREATE INDEX idx_positions_display_order ON positions(election_id, display_order);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  election_id uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  photo_url text,
  bio text,
  manifesto text,
  fide_title varchar(255),
  zone varchar(100),
  achievements text,
  video_url text,
  status candidate_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_candidate_per_position UNIQUE(position_id, user_id)
);

CREATE INDEX idx_candidates_position_id ON candidates(position_id);
CREATE INDEX idx_candidates_election_id ON candidates(election_id);
CREATE INDEX idx_candidates_user_id ON candidates(user_id);
CREATE INDEX idx_candidates_status ON candidates(status);

-- Votes table (cast votes)
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_hash varchar(64) NOT NULL UNIQUE, -- SHA256 hash of vote
  ip_address inet,
  device_fingerprint varchar(255),
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_vote_per_position UNIQUE(voter_id, position_id, election_id)
);

CREATE INDEX idx_votes_election_id ON votes(election_id);
CREATE INDEX idx_votes_position_id ON votes(position_id);
CREATE INDEX idx_votes_candidate_id ON votes(candidate_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);
CREATE INDEX idx_votes_created_at ON votes(created_at);

-- Vote receipts (proof of vote without revealing content)
CREATE TABLE IF NOT EXISTS vote_receipts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  election_id uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  receipt_hash varchar(64) NOT NULL, -- Hash for verification
  vote_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT unique_receipt_per_election UNIQUE(voter_id, election_id)
);

CREATE INDEX idx_vote_receipts_voter_id ON vote_receipts(voter_id);
CREATE INDEX idx_vote_receipts_election_id ON vote_receipts(election_id);
CREATE INDEX idx_vote_receipts_created_at ON vote_receipts(created_at);

-- Vote audit log (for monitoring and security)
CREATE TABLE IF NOT EXISTS vote_audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  voter_id_hashed varchar(64), -- Never store actual voter_id in audit
  action audit_action NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  timestamp timestamp with time zone DEFAULT now(),
  
  CONSTRAINT audit_details_non_null CHECK (details IS NOT NULL)
);

CREATE INDEX idx_vote_audit_log_election_id ON vote_audit_log(election_id);
CREATE INDEX idx_vote_audit_log_action ON vote_audit_log(action);
CREATE INDEX idx_vote_audit_log_timestamp ON vote_audit_log(timestamp);

-- Candidate documents (qualifications, credentials, etc.)
CREATE TABLE IF NOT EXISTS candidate_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  doc_type document_type NOT NULL,
  file_url text NOT NULL,
  verified boolean DEFAULT false,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_candidate_documents_candidate_id ON candidate_documents(candidate_id);
CREATE INDEX idx_candidate_documents_doc_type ON candidate_documents(doc_type);
CREATE INDEX idx_candidate_documents_verified ON candidate_documents(verified);

-- Election announcements
CREATE TABLE IF NOT EXISTS election_announcements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  body text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_election_announcements_election_id ON election_announcements(election_id);
CREATE INDEX idx_election_announcements_created_at ON election_announcements(created_at);

-- Bookmarks (voter bookmarks for candidates)
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_bookmark UNIQUE(user_id, candidate_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_candidate_id ON bookmarks(candidate_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Elections: Everyone can read active elections, admins can manage all
CREATE POLICY elections_read ON elections
  FOR SELECT USING (
    status = 'active' 
    OR auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY elections_insert ON elections
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY elections_update ON elections
  FOR UPDATE USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  ) WITH CHECK (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

-- Positions: Read if election is visible, manage if admin
CREATE POLICY positions_read ON positions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM elections e
      WHERE e.id = positions.election_id
      AND (
        e.status = 'active'
        OR auth.uid() = e.created_by
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('admin', 'superadmin')
        )
      )
    )
  );

CREATE POLICY positions_manage ON positions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM elections e
      WHERE e.id = positions.election_id
      AND (auth.uid() = e.created_by OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'superadmin'
      ))
    )
  );

CREATE POLICY positions_update ON positions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM elections e
      WHERE e.id = positions.election_id
      AND (auth.uid() = e.created_by OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'superadmin'
      ))
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM elections e
      WHERE e.id = positions.election_id
      AND (auth.uid() = e.created_by OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'superadmin'
      ))
    )
  );

-- Candidates: Public view, managed by admin
CREATE POLICY candidates_read ON candidates
  FOR SELECT USING (
    status = 'approved'
    OR EXISTS (
      SELECT 1 FROM elections e
      WHERE e.id = candidates.election_id
      AND e.status = 'active'
    )
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY candidates_insert ON candidates
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM elections e
      WHERE e.id = candidates.election_id
      AND e.status IN ('scheduled', 'active')
    )
  );

CREATE POLICY candidates_update ON candidates
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  ) WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Votes: Users can only see their own receipts
CREATE POLICY votes_read_own_receipt ON votes
  FOR SELECT USING (
    auth.uid() = voter_id
  );

CREATE POLICY votes_admin_read ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY votes_insert ON votes
  FOR INSERT WITH CHECK (
    auth.uid() = voter_id
    AND EXISTS (
      SELECT 1 FROM elections e
      WHERE e.id = votes.election_id
      AND e.status = 'active'
      AND NOW() BETWEEN e.start_time AND e.end_time
    )
  );

-- Vote receipts: Users can only see their own
CREATE POLICY vote_receipts_read ON vote_receipts
  FOR SELECT USING (
    auth.uid() = voter_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY vote_receipts_insert ON vote_receipts
  FOR INSERT WITH CHECK (
    auth.uid() = voter_id
  );

-- Vote audit log: Admin only
CREATE POLICY vote_audit_log_read ON vote_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY vote_audit_log_insert ON vote_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Candidate documents: Public if verified, candidate/admin own
CREATE POLICY candidate_documents_read ON candidate_documents
  FOR SELECT USING (
    verified
    OR auth.uid() = (SELECT user_id FROM candidates WHERE id = candidate_documents.candidate_id)
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY candidate_documents_manage ON candidate_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM candidates c
      WHERE c.id = candidate_documents.candidate_id
      AND auth.uid() = c.user_id
    )
  );

CREATE POLICY candidate_documents_update ON candidate_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

-- Election announcements: Public read, admin write
CREATE POLICY election_announcements_read ON election_announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM elections e
      WHERE e.id = election_announcements.election_id
      AND e.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY election_announcements_manage ON election_announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM elections e
      WHERE e.id = election_announcements.election_id
      AND (auth.uid() = e.created_by OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'superadmin'
      ))
    )
  );

-- Bookmarks: Users can only manage their own
CREATE POLICY bookmarks_read ON bookmarks
  FOR SELECT USING (
    auth.uid() = user_id
  );

CREATE POLICY bookmarks_manage ON bookmarks
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY bookmarks_delete ON bookmarks
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to hash voter ID for audit logs
CREATE OR REPLACE FUNCTION hash_voter_id(voter_id uuid)
RETURNS varchar AS $$
BEGIN
  RETURN encode(digest(voter_id::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate vote hash
CREATE OR REPLACE FUNCTION generate_vote_hash(election_id uuid, position_id uuid, candidate_id uuid, voter_id uuid)
RETURNS varchar AS $$
BEGIN
  RETURN encode(digest(
    election_id::text || position_id::text || candidate_id::text || voter_id::text || extract(epoch from NOW())::text,
    'sha256'
  ), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_elections_updated_at BEFORE UPDATE ON elections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_documents_updated_at BEFORE UPDATE ON candidate_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_election_announcements_updated_at BEFORE UPDATE ON election_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
