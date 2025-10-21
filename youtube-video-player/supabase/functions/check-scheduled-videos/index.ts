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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    const now = new Date().toISOString();

    // Fetch scheduled videos that are due
    const scheduledResponse = await fetch(
      `${supabaseUrl}/rest/v1/scheduled_videos?played=eq.false&scheduled_time=lte.${now}&auto_play=eq.true&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        }
      }
    );

    if (!scheduledResponse.ok) {
      throw new Error('Failed to fetch scheduled videos');
    }

    const scheduledVideos = await scheduledResponse.json();

    if (scheduledVideos.length === 0) {
      return new Response(JSON.stringify({ data: { message: 'No videos due', count: 0 } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get current max position in queue
    const queueResponse = await fetch(
      `${supabaseUrl}/rest/v1/video_queue?select=position&order=position.desc&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        }
      }
    );

    const queueData = await queueResponse.json();
    let maxPosition = queueData.length > 0 ? queueData[0].position : -1;

    // Add each scheduled video to queue
    const addedVideos = [];
    for (const video of scheduledVideos) {
      maxPosition++;
      
      // Fetch video details from YouTube if duration is missing
      let duration = video.duration || 0;
      if (!duration && video.video_id) {
        const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
        if (youtubeApiKey) {
          const ytResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${video.video_id}&key=${youtubeApiKey}`
          );
          if (ytResponse.ok) {
            const ytData = await ytResponse.json();
            if (ytData.items && ytData.items.length > 0) {
              const ytDuration = ytData.items[0].contentDetails.duration;
              // Parse ISO 8601 duration (PT1H2M30S)
              const match = ytDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
              if (match) {
                const hours = parseInt(match[1] || '0');
                const minutes = parseInt(match[2] || '0');
                const seconds = parseInt(match[3] || '0');
                duration = hours * 3600 + minutes * 60 + seconds;
              }
            }
          }
        }
      }

      // Add to queue
      const queueItem = {
        video_id: video.video_id,
        title: video.title,
        channel: video.channel || '',
        thumbnail_url: video.thumbnail_url || '',
        duration: duration,
        start_time: 0,
        end_time: duration,
        position: maxPosition
      };

      const insertResponse = await fetch(
        `${supabaseUrl}/rest/v1/video_queue`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(queueItem)
        }
      );

      if (insertResponse.ok) {
        addedVideos.push(video.title);

        // Mark as played
        await fetch(
          `${supabaseUrl}/rest/v1/scheduled_videos?id=eq.${video.id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ played: true })
          }
        );
      }
    }

    return new Response(JSON.stringify({
      data: {
        message: 'Scheduled videos processed',
        count: addedVideos.length,
        videos: addedVideos
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Scheduled video check error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'SCHEDULED_CHECK_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
