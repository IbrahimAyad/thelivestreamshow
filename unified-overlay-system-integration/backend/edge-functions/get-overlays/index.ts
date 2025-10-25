import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseServiceRoleKey) {
      throw new Error('Service role key not found');
    }

    // Fetch all overlays with their content
    const overlaysResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/overlays?is_active=eq.true&select=*`, {
      headers: {
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });

    const overlays = await overlaysResponse.json();

    // Fetch content for each overlay
    const enrichedOverlays = await Promise.all(overlays.map(async (overlay) => {
      const contentResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/overlay_content?overlay_id=eq.${overlay.id}&select=*`, {
        headers: {
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });

      const content = await contentResponse.json();
      const chatResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/chat_messages?overlay_id=eq.${overlay.id}&is_active=eq.true&select=*&order=display_order.asc`, {
        headers: {
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });

      const chatMessages = await chatResponse.json();

      return {
        ...overlay,
        content: content.reduce((acc, item) => {
          acc[item.field_name] = item.field_value;
          return acc;
        }, {}),
        chatMessages: chatMessages || []
      };
    }));

    return new Response(JSON.stringify({ data: enrichedOverlays }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    
    const errorResponse = {
      error: {
        code: 'OVERLAY_FETCH_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});