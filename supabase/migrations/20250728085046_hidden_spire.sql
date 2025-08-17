/*
  # Restore Database Webhook Trigger

  1. Functions
    - `notify_new_lead()` - Sends HTTP webhook when new lead is created
    - `update_updated_at_column()` - Updates timestamp on record changes

  2. Triggers  
    - `new_lead_trigger` - Automatically calls webhook on INSERT
    - `update_leads_updated_at` - Updates timestamp on UPDATE

  3. Requirements
    - pg_net extension must be enabled
    - Sends webhook to https://n8n.arsenio.at/webhook/analyse-leads
*/

-- Enable pg_net extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to send webhook notification for new leads
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT := 'https://n8n.arsenio.at/webhook/analyse-leads';
    payload JSONB;
BEGIN
    -- Build webhook payload
    payload := jsonb_build_object(
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
    );

    -- Send HTTP POST request to n8n webhook
    PERFORM net.http_post(
        url := webhook_url,
        body := payload::text,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'User-Agent', 'Supabase-Webhook/1.0'
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new leads (webhook notification)
DROP TRIGGER IF EXISTS new_lead_trigger ON leads;
CREATE TRIGGER new_lead_trigger
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_lead();

-- Create trigger for updating timestamps
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();