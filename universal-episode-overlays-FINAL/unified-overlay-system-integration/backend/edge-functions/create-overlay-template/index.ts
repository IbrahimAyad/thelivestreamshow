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

    const { name, type, description } = await req.json();

    if (!name || !type) {
      throw new Error('Name and type are required');
    }

    // Create overlay
    const overlayResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/overlays`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name,
        type,
        description: description || '',
        config: {},
        is_active: true
      })
    });

    const [overlay] = await overlayResponse.json();

    // Create default content based on type
    let defaultContent = {};
    let defaultChatMessages = [];

    if (type === 'main_stream') {
      defaultContent = {
        season: 'Season 4',
        episode: 'Episode 31',
        show_name: 'THE LIVE STREAM SHOW',
        episode_title: 'Purposeful Illusion',
        social_handle: '@abelivestream',
        status_text: 'LIVE'
      };

      defaultChatMessages = [
        { message_text: 'Rattlesnake just followed!', message_type: 'follower' },
        { message_text: 'Jags subscribed for 3 months!', message_type: 'subscriber' },
        { message_text: 'El Garza donated $5.00', message_type: 'donation' },
        { message_text: 'Austin is hosting with 25 viewers', message_type: 'host' },
        { message_text: 'Babs raided with 50 viewers!', message_type: 'raid' },
        { message_text: 'Welcome to the stream!', message_type: 'chat' },
        { message_text: 'Great show tonight!', message_type: 'chat' },
        { message_text: 'Love this episode', message_type: 'chat' },
        { message_text: 'When is the next episode?', message_type: 'chat' },
        { message_text: 'Amazing content as always', message_type: 'chat' },
        { message_text: 'Follow for more great content!', message_type: 'chat' },
        { message_text: 'Keep it up!', message_type: 'chat' },
        { message_text: 'You rock!', message_type: 'chat' },
        { message_text: 'New subscriber alert!', message_type: 'subscriber' },
        { message_text: 'Thanks for the follow!', message_type: 'follower' },
        { message_text: 'This is so cool!', message_type: 'chat' },
        { message_text: 'Donation incoming!', message_type: 'chat' },
        { message_text: 'Best stream ever!', message_type: 'chat' },
        { message_text: 'Can\'t wait for next week', message_type: 'chat' },
        { message_text: 'Subscribed to the channel!', message_type: 'subscriber' },
        { message_text: 'Awesome show!', message_type: 'chat' },
        { message_text: 'Keep it going!', message_type: 'chat' },
        { message_text: 'Another great episode', message_type: 'chat' },
        { message_text: 'Thank you for the content!', message_type: 'chat' },
        { message_text: 'Love the energy!', message_type: 'chat' },
        { message_text: 'Subscribed and following!', message_type: 'subscriber' },
        { message_text: 'Donation of $10 received!', message_type: 'donation' },
        { message_text: 'This is amazing!', message_type: 'chat' },
        { message_text: 'Best content creator!', message_type: 'chat' },
        { message_text: 'Can\'t stop watching!', message_type: 'chat' },
        { message_text: 'New viewer here!', message_type: 'chat' },
        { message_text: 'Subscribed for life!', message_type: 'subscriber' },
        { message_text: 'Followed the channel!', message_type: 'follower' },
        { message_text: 'Donation alert!', message_type: 'donation' },
        { message_text: 'This episode rocks!', message_type: 'chat' },
        { message_text: 'Love this show!', message_type: 'chat' },
        { message_text: 'Amazing work!', message_type: 'chat' },
        { message_text: 'Keep creating!', message_type: 'chat' },
        { message_text: 'Another subscriber!', message_type: 'subscriber' },
        { message_text: 'Great energy tonight!', message_type: 'chat' },
        { message_text: 'Donation of $25!', message_type: 'donation' },
        { message_text: 'This is so good!', message_type: 'chat' },
        { message_text: 'Following and subscribed!', message_type: 'follower' },
        { message_text: 'Best stream!', message_type: 'chat' },
        { message_text: 'Thanks for the amazing show!', message_type: 'chat' },
        { message_text: 'Can\'t wait for tomorrow', message_type: 'chat' },
        { message_text: 'Subscribed to all notifications!', message_type: 'subscriber' },
        { message_text: 'Huge donation received!', message_type: 'donation' },
        { message_text: 'This is incredible!', message_type: 'chat' },
        { message_text: 'Amazing episode!', message_type: 'chat' }
      ];
    } else if (type === 'starting_soon') {
      defaultContent = {
        title: 'Starting Soon',
        subtitle: 'We\'ll be right back',
        timer_text: '5 minutes',
        background_color: '#1a1a1a'
      };

      defaultChatMessages = [
        { message_text: 'Stream starting soon!', message_type: 'chat' },
        { message_text: 'Can\'t wait!', message_type: 'chat' },
        { message_text: 'Getting excited!', message_type: 'chat' },
        { message_text: 'Almost time!', message_type: 'chat' },
        { message_text: 'Ready for the show!', message_type: 'chat' }
      ];
    } else if (type === 'brb') {
      defaultContent = {
        title: 'Be Right Back',
        subtitle: 'Taking a quick break',
        timer_text: '10 minutes',
        background_color: '#1a1a1a'
      };

      defaultChatMessages = [
        { message_text: 'BRB!', message_type: 'chat' },
        { message_text: 'Take your time!', message_type: 'chat' },
        { message_text: 'Coffee break!', message_type: 'chat' },
        { message_text: 'I\'ll wait!', message_type: 'chat' },
        { message_text: 'All good!', message_type: 'chat' }
      ];
    } else {
      defaultContent = {
        title: 'Custom Overlay',
        subtitle: 'Ready to go live',
        background_color: '#1a1a1a'
      };

      defaultChatMessages = [
        { message_text: 'Stream is live!', message_type: 'chat' },
        { message_text: 'Welcome everyone!', message_type: 'chat' }
      ];
    }

    // Insert default content
    if (Object.keys(defaultContent).length > 0) {
      const contentEntries = Object.entries(defaultContent).map(([fieldName, fieldValue]) => ({
        overlay_id: overlay.id,
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

    // Insert default chat messages
    if (defaultChatMessages.length > 0) {
      const chatEntries = defaultChatMessages.map((message, index) => ({
        overlay_id: overlay.id,
        message_type: message.message_type,
        message_text: message.message_text,
        display_order: index,
        is_active: true,
        animation_type: 'slideInRight'
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

    return new Response(JSON.stringify({ data: overlay }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    
    const errorResponse = {
      error: {
        code: 'OVERLAY_CREATE_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});