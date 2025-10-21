Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const twitchClientId = Deno.env.get('TWITCH_CLIENT_ID');
    const twitchOAuthToken = Deno.env.get('TWITCH_OAUTH_TOKEN');
    const twitchUsername = Deno.env.get('TWITCH_USERNAME') || 'AbeNasty';

    if (!twitchClientId || !twitchOAuthToken) {
      return new Response(JSON.stringify({
        error: 'Twitch API credentials not configured',
        configured: false,
        data: {
          viewerCount: 0,
          chatRate: 0,
          followerCount: 0,
          streamStatus: 'offline',
          error: 'API credentials missing'
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user ID first
    const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${twitchUsername}`, {
      headers: {
        'Client-ID': twitchClientId,
        'Authorization': `Bearer ${twitchOAuthToken}`
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Twitch user API failed: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    if (!userData.data || userData.data.length === 0) {
      throw new Error('User not found');
    }

    const userId = userData.data[0].id;

    // Get stream data
    const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_login=${twitchUsername}`, {
      headers: {
        'Client-ID': twitchClientId,
        'Authorization': `Bearer ${twitchOAuthToken}`
      }
    });

    if (!streamResponse.ok) {
      throw new Error(`Twitch stream API failed: ${streamResponse.status}`);
    }

    const streamData = await streamResponse.json();
    const isLive = streamData.data && streamData.data.length > 0;
    const viewerCount = isLive ? streamData.data[0].viewer_count : 0;

    // Get follower count
    const followersResponse = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}`, {
      headers: {
        'Client-ID': twitchClientId,
        'Authorization': `Bearer ${twitchOAuthToken}`
      }
    });

    let followerCount = 0;
    if (followersResponse.ok) {
      const followersData = await followersResponse.json();
      followerCount = followersData.total || 0;
    }

    // Calculate chat rate (simplified - in production, you'd fetch recent messages)
    // For now, estimate based on viewer count
    const chatRate = isLive ? Math.floor(viewerCount * 0.05) : 0;

    const result = {
      viewerCount,
      chatRate,
      followerCount,
      streamStatus: isLive ? 'live' : 'offline',
      platform: 'twitch',
      timestamp: new Date().toISOString()
    };

    // Store in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/stream_stats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'twitch',
          viewer_count: viewerCount,
          chat_rate: chatRate,
          follower_count: followerCount,
          stream_status: isLive ? 'live' : 'offline'
        })
      });
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Twitch stats error:', error);

    return new Response(JSON.stringify({
      error: error.message,
      configured: false,
      data: {
        viewerCount: 0,
        chatRate: 0,
        followerCount: 0,
        streamStatus: 'offline',
        error: error.message
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
