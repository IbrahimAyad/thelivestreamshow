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

    const { overlayId, content, chatMessages } = await req.json();

    if (!overlayId) {
      throw new Error('Overlay ID is required');
    }

    // Update overlay content
    if (content && Object.keys(content).length > 0) {
      // Delete existing content
      await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/overlay_content?overlay_id=eq.${overlayId}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Insert new content
      const contentEntries = Object.entries(content).map(([fieldName, fieldValue]) => ({
        overlay_id: overlayId,
        field_name: fieldName,
        field_value: fieldValue,
        field_type: typeof fieldValue === 'number' ? 'number' : 'text'
      }));

      await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/overlay_content`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contentEntries)
      });
    }

    // Update chat messages
    if (chatMessages && chatMessages.length > 0) {
      // Delete existing chat messages
      await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/chat_messages?overlay_id=eq.${overlayId}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Insert new chat messages
      const chatEntries = chatMessages.map((message, index) => ({
        overlay_id: overlayId,
        message_type: message.message_type || 'chat',
        message_text: message.message_text,
        display_order: index,
        is_active: message.is_active !== false,
        animation_type: message.animation_type || 'slideInRight'
      }));

      await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/chat_messages`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chatEntries)
      });
    }

    // Update timestamp
    await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/overlays?id=eq.${overlayId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ updated_at: new Date().toISOString() })
    });

    return new Response(JSON.stringify({ 
      data: { 
        message: 'Overlay updated successfully',
        overlayId: overlayId 
      } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    
    const errorResponse = {
      error: {
        code: 'OVERLAY_UPDATE_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});