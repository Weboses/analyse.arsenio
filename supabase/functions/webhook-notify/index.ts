import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { leadId, firstName, email, websiteUrl } = await req.json()

    // Send webhook to n8n
    const webhookResponse = await fetch('https://n8n.arsenio.at/webhook/analyse-leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'lead.created',
        data: {
          id: leadId,
          first_name: firstName,
          website_url: websiteUrl,
          email: email
        },
        timestamp: new Date().toISOString()
      })
    })

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed: ${webhookResponse.status}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})