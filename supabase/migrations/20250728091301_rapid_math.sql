/*
  # Create simplified RPC function for lead creation

  1. New RPC Function
    - `notify_new_lead(first_name, email, website_url)`
    - Returns UUID of created lead
    - Sends webhook to n8n automatically
    - Uses only 4 core fields: id, first_name, email, website_url

  2. Security
    - SECURITY DEFINER allows API access
    - RLS policies control access
    - Function is available via REST API

  3. Workflow
    - Frontend calls RPC
    - Lead gets saved with status 'pending'
    - Webhook sent to n8n immediately
    - n8n can update analysis_sent later
*/

-- Create simplified RPC function
CREATE OR REPLACE FUNCTION notify_new_lead(
  first_name text,
  email text,
  website_url text
)
RETURNS uuid AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Lead in Tabelle speichern (nur 4 Kernfelder)
  INSERT INTO leads (id, first_name, email, website_url, status, analysis_sent)
  VALUES (gen_random_uuid(), first_name, email, website_url, 'pending', false)
  RETURNING id INTO new_id;

  -- Webhook an n8n senden
  PERFORM net.http_post(
    url := 'https://n8n.arsenio.at/webhook/analyse-leads',
    body := json_build_object(
      'type', 'lead.created',
      'data', json_build_object(
        'id', new_id,
        'first_name', first_name,
        'website_url', website_url,
        'email', email,
        'status', 'pending',
        'created_at', NOW()
      ),
      'timestamp', NOW()
    )::text,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure RLS policy allows RPC calls
DROP POLICY IF EXISTS "Allow RPC lead creation" ON leads;
CREATE POLICY "Allow RPC lead creation" 
  ON leads FOR INSERT 
  TO authenticated, anon
  WITH CHECK (true);

-- Grant execute permission for RPC
GRANT EXECUTE ON FUNCTION notify_new_lead(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION notify_new_lead(text, text, text) TO authenticated;