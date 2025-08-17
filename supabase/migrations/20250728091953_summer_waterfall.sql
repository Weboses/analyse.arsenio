/*
  # Fix RPC function to remove phone field requirement

  1. Updates
    - Remove phone parameter from notify_new_lead function
    - Function now only accepts first_name, email, website_url
    - Webhook payload updated to exclude phone field

  2. Security
    - Maintains SECURITY DEFINER for proper access control
    - Returns UUID of created lead for tracking
*/

CREATE OR REPLACE FUNCTION notify_new_lead(
  first_name text,
  email text,
  website_url text
)
RETURNS uuid AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Lead in Tabelle speichern (ohne phone)
  INSERT INTO leads (id, first_name, email, website_url, status, analysis_sent)
  VALUES (gen_random_uuid(), first_name, email, website_url, 'pending', false)
  RETURNING id INTO new_id;

  -- Webhook an n8n senden (ohne phone)
  PERFORM net.http_post(
    url := 'https://n8n.arsenio.at/webhook/analyse-leads',
    body := json_build_object(
      'type', 'lead.created',
      'data', json_build_object(
        'id', new_id,
        'first_name', first_name,
        'website_url', website_url,
        'email', email
      ),
      'timestamp', NOW()
    )::text,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;