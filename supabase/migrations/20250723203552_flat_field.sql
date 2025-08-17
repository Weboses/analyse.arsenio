/*
  # Setup n8n Webhook System for Lead Analysis

  1. Database Function
    - `notify_new_lead()` function that sends HTTP POST to n8n
    - Triggers automatically when new lead is inserted
    - Uses Supabase's built-in `net.http_post` function

  2. Database Trigger
    - `new_lead_trigger` fires AFTER INSERT on leads table
    - Calls the notify function for each new row
    - Non-blocking execution

  3. Integration
    - Sends structured JSON payload to n8n webhook
    - Includes all lead data needed for analysis
    - Timestamp for tracking and debugging
*/

-- Create the function that will send webhook to n8n
create or replace function notify_new_lead()
returns trigger as $$
declare
begin
  -- Send HTTP POST request to n8n webhook
  perform
    net.http_post(
      url := 'https://n8n.arsenio.at/webhook/analyse-leads',
      headers := jsonb_build_object('Content-Type','application/json'),
      body := jsonb_build_object(
        'type', 'lead.created',
        'data', jsonb_build_object(
          'id', NEW.id,
          'first_name', NEW.first_name,
          'website_url', NEW.website_url,
          'email', NEW.email,
          'phone', NEW.phone,
          'created_at', NEW.created_at,
          'status', NEW.status
        ),
        'timestamp', now()
      )
    );
  
  -- Return the new row (required for AFTER INSERT triggers)
  return NEW;
end;
$$ language plpgsql;

-- Create the trigger that fires after each insert
create trigger new_lead_trigger
  after insert on leads
  for each row 
  execute function notify_new_lead();