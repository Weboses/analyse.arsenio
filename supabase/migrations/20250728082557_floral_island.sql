/*
  # Fix webhook SQL syntax error
  
  This fixes the missing FROM clause error in the webhook function.
  The query needs to be part of a trigger function, not a standalone SELECT.
*/

-- First, let's create or replace the webhook function
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Send webhook to n8n with lead data
  PERFORM net.http_post(
    url := 'https://n8n.arsenio.at/webhook/analyse-leads',
    body := json_build_object(
      'type', 'lead.created',
      'data', json_build_object(
        'id', NEW.id,
        'first_name', NEW.first_name,
        'website_url', NEW.website_url,
        'email', NEW.email,
        'phone', NEW.phone,
        'created_at', NEW.created_at,
        'status', NEW.status
      ),
      'timestamp', NOW()
    )::text,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS new_lead_trigger ON leads;
CREATE TRIGGER new_lead_trigger
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_lead();