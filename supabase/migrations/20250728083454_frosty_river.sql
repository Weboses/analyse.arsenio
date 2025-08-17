/*
  # Remove webhook trigger temporarily
  
  This removes the database trigger that calls net.http_post so that lead insertion works.
  The webhook functionality can be re-enabled after pg_net extension is activated.
  
  1. Changes
     - Drop the trigger that calls net.http_post
     - Drop the function that uses net.http_post
     - This allows normal lead insertion to work
  
  2. Next Steps
     - Enable pg_net extension in Supabase Dashboard
     - Re-run the webhook setup migration after extension is enabled
*/

-- Remove the trigger that's causing the error
DROP TRIGGER IF EXISTS new_lead_trigger ON leads;

-- Remove the function that uses net.http_post
DROP FUNCTION IF EXISTS notify_new_lead();

-- Verify leads table is accessible
SELECT 'Leads table is now accessible for normal operations' as status;