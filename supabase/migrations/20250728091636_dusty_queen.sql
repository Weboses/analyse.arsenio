/*
  # Add analysis content storage

  1. New Columns
    - `analysis_content` (text) - Stores the full analysis content that was sent via email
    - `analysis_sent_at` (timestamptz) - Timestamp when analysis was sent

  2. Purpose
    - Track what analysis content was actually sent to each lead
    - Enable resending or referencing previous analyses
    - Audit trail for sent communications

  3. Usage
    - n8n workflow updates this after sending analysis email
    - Can be used for follow-up communications
    - Helps with customer support and tracking
*/

-- Add column to store the analysis content that was sent
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS analysis_content text,
ADD COLUMN IF NOT EXISTS analysis_sent_at timestamptz;

-- Add index for faster queries on analysis_sent_at
CREATE INDEX IF NOT EXISTS leads_analysis_sent_at_idx ON leads (analysis_sent_at DESC);

-- Add comment to explain the column purpose
COMMENT ON COLUMN leads.analysis_content IS 'Full analysis content that was sent to the lead via email';
COMMENT ON COLUMN leads.analysis_sent_at IS 'Timestamp when the analysis was sent to the lead';