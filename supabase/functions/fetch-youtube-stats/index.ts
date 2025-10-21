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
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');

    if (!youtubeApiKey) {
      return new Response(JSON.stringify({
        error: 'YouTube API key not configured',
        configured: false,
        data: {
          viewerCount: 0,
          chatRate: 0,
          subscriberCount: 0,
          streamStatus: 'offline',
          error: 'API key missing'
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get channel info to find active live broadcasts
    // Note: This requires the channel ID - you may need to configure this
    const channelId = Deno.env.get('YOUTUBE_CHANNEL_ID') || '';

    if (!channelId) {
      return new Response(JSON.stringify({
        error: 'YouTube channel ID not configured',
        configured: false,
        data: {
          viewerCount: 0,
          chatRate: 0,
          subscriberCount: 0,
          streamStatus: 'offline',
          error: 'Channel ID not configured'
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get channel statistics
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${youtubeApiKey}`
    );

    if (!channelResponse.ok) {
      throw new Error(`YouTube channel API failed: ${channelResponse.status}`);
    }

    const channelData = await channelResponse.json();
    let subscriberCount = 0;

    if (channelData.items && channelData.items.length > 0) {
      subscriberCount = parseInt(channelData.items[0].statistics.subscriberCount) || 0;
    }

    // Get active live broadcasts
    const liveBroadcastsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&broadcastStatus=active&maxResults=1&key=${youtubeApiKey}`
    );

    let viewerCount = 0;
    let chatRate = 0;
    let isLive = false;
    let liveVideoId = null;

    if (liveBroadcastsResponse.ok) {
      const liveBroadcastsData = await liveBroadcastsResponse.json();
      
      if (liveBroadcastsData.items && liveBroadcastsData.items.length > 0) {
        isLive = true;
        liveVideoId = liveBroadcastsData.items[0].id;

        // Get live video statistics
        const videoResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,statistics&id=${liveVideoId}&key=${youtubeApiKey}`
        );

        if (videoResponse.ok) {
          const videoData = await videoResponse.json();
          if (videoData.items && videoData.items.length > 0) {
            const liveDetails = videoData.items[0].liveStreamingDetails;
            viewerCount = parseInt(liveDetails?.concurrentViewers) || 0;
            
            // Estimate chat rate based on viewer count
            chatRate = Math.floor(viewerCount * 0.03);
          }
        }
      }
    }

    const result = {
      viewerCount,
      chatRate,
      subscriberCount,
      streamStatus: isLive ? 'live' : 'offline',
      platform: 'youtube',
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
          platform: 'youtube',
          viewer_count: viewerCount,
          chat_rate: chatRate,
          subscriber_count: subscriberCount,
          stream_status: isLive ? 'live' : 'offline'
        })
      });
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('YouTube stats error:', error);

    return new Response(JSON.stringify({
      error: error.message,
      configured: false,
      data: {
        viewerCount: 0,
        chatRate: 0,
        subscriberCount: 0,
        streamStatus: 'offline',
        error: error.message
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
