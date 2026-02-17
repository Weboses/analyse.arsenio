-- Add new columns for enhanced analysis
ALTER TABLE analysis_results ADD COLUMN detected_technologies TEXT;
ALTER TABLE analysis_results ADD COLUMN security_score INTEGER;
