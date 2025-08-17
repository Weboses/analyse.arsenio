/*
  # Simplified RPC function without webhook

  1. New Functions
    - `notify_new_lead` - Creates lead without webhook (pg_net not available)
  
  2. Changes
    - Removed net.http_post dependency
    - Simple lead creation only
    - Returns lead ID for frontend processing
  
  3. Notes
    - Webhook will be handled via Edge Function instead
    - More reliable approach without pg_net dependency
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS notify_new_lead(text, text, text);

-- Create simplified function without webhook
CREATE OR REPLACE FUNCTION notify_new_lead(
  first_name text,
  email text,
  website_url text
)
RETURNS uuid AS $$
DECLARE
  new_id uuid;
  normalized_url text;
BEGIN
  -- Normalize URL (add https:// if missing)
  normalized_url := website_url;
  IF normalized_url !~ '^https?://' THEN
    normalized_url := 'https://' || normalized_url;
  END IF;

  -- Insert lead into table
  INSERT INTO leads (
    id, 
    first_name, 
    email, 
    website_url, 
    status, 
    analysis_sent,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(), 
    first_name, 
    email, 
    normalized_url, 
    'pending', 
    false,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION notify_new_lead(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION notify_new_lead(text, text, text) TO authenticated;