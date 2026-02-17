-- Turso/SQLite Database Schema
-- Run this migration to create the tables

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  website_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analysis_results (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id),

  -- PageSpeed Scores (0-100)
  performance_score_mobile INTEGER,
  performance_score_desktop INTEGER,
  accessibility_score INTEGER,
  best_practices_score INTEGER,
  seo_score INTEGER,

  -- Core Web Vitals
  lcp_mobile TEXT,
  lcp_desktop TEXT,
  fcp_mobile TEXT,
  fcp_desktop TEXT,
  cls_mobile TEXT,
  cls_desktop TEXT,
  tbt_mobile TEXT,
  tbt_desktop TEXT,

  -- SEO Data
  meta_title TEXT,
  meta_title_length INTEGER,
  meta_description TEXT,
  meta_description_length INTEGER,
  has_h1 INTEGER,
  h1_count INTEGER,
  h2_count INTEGER,
  h3_count INTEGER,
  missing_alt_images INTEGER,
  total_images INTEGER,
  has_sitemap INTEGER,
  has_robots_txt INTEGER,

  -- Technical
  is_https INTEGER,
  is_mobile_friendly INTEGER,
  detected_cms TEXT,

  -- Links
  total_links INTEGER,
  internal_links INTEGER,
  external_links INTEGER,
  broken_links_count INTEGER,
  broken_links TEXT,

  -- AI Recommendations
  ai_recommendations TEXT,
  html_report TEXT,

  -- Raw Data (JSON)
  raw_mobile_data TEXT,
  raw_desktop_data TEXT,
  raw_seo_data TEXT,

  -- Meta
  screenshot_url TEXT,
  analyzed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  email_sent INTEGER DEFAULT 0,
  email_sent_at TEXT
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_analysis_lead_id ON analysis_results(lead_id);
