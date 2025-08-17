const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface LeadData {
  id: string;
  first_name: string;
  website_url: string;
  email: string;
  phone?: string;
  created_at: string;
  status: string;
}

interface WebhookPayload {
  type: 'lead.created';
  data: LeadData;
  timestamp: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload = await req.json();
    console.log('Received payload:', JSON.stringify(payload, null, 2));
    
    // Handle both direct record and nested record formats
    const record = payload.record || payload;
    
    // Validate that we have the required data
    if (!record || !record.id) {
      console.error('Invalid payload structure:', payload);
      throw new Error('Invalid webhook payload - missing record data');
    }

    // Prepare webhook payload for n8n
    const webhookPayload: WebhookPayload = {
      type: 'lead.created',
      data: {
        id: record.id,
        first_name: record.first_name,
        website_url: record.website_url,
        email: record.email,
        phone: record.phone || null,
        created_at: record.created_at,
        status: record.status
      },
      timestamp: new Date().toISOString()
    };

    // Use production n8n webhook URL
    const n8nWebhookUrl = 'https://n8n.arsenio.at/webhook/analyse-leads';
    
    console.log('Sending webhook to:', n8nWebhookUrl);
    console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));

    // Send webhook to n8n
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Webhook/1.0',
        'Accept': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error response:', errorText);
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.text();
    console.log('n8n webhook response:', responseData);

    console.log(`Successfully sent webhook to n8n for lead: ${record.id}`);
    console.log(`Lead name: ${record.first_name}, Email: ${record.email}`);
    console.log(`Website: ${record.website_url}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook sent to n8n successfully',
        leadId: record.id,
        leadName: record.first_name,
        webhookUrl: n8nWebhookUrl
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Error in n8n webhook function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});