Deno.serve(async (req) => {
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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Fetch all jingles
    const jinglesResponse = await fetch(
      `${supabaseUrl}/rest/v1/music_library?category=eq.jingle&select=id,title,friendly_name,jingle_type,duration,file_format`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    if (!jinglesResponse.ok) {
      throw new Error('Failed to fetch jingles');
    }

    const jingles = await jinglesResponse.json();

    // Fetch all music tracks
    const musicResponse = await fetch(
      `${supabaseUrl}/rest/v1/music_library?category=eq.music&select=id,title,artist,album,friendly_name,duration,file_format`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    if (!musicResponse.ok) {
      throw new Error('Failed to fetch music');
    }

    const music = await musicResponse.json();

    // Fetch all playlists
    const playlistsResponse = await fetch(
      `${supabaseUrl}/rest/v1/playlists?select=id,name,description,track_ids`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    if (!playlistsResponse.ok) {
      throw new Error('Failed to fetch playlists');
    }

    const playlists = await playlistsResponse.json();

    // Format the response
    const formattedJingles = jingles.map((j: any) => ({
      id: j.id,
      name: j.friendly_name || j.title,
      title: j.title,
      type: j.jingle_type,
      duration: j.duration,
      format: j.file_format
    }));

    const formattedMusic = music.map((m: any) => ({
      id: m.id,
      name: m.friendly_name || m.title,
      title: m.title,
      artist: m.artist,
      album: m.album,
      duration: m.duration,
      format: m.file_format
    }));

    const formattedPlaylists = playlists.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      track_count: (p.track_ids || []).length
    }));

    return new Response(JSON.stringify({
      data: {
        jingles: formattedJingles,
        music: formattedMusic,
        playlists: formattedPlaylists,
        total_count: {
          jingles: formattedJingles.length,
          music: formattedMusic.length,
          playlists: formattedPlaylists.length
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get audio list error:', error);

    const errorResponse = {
      error: {
        code: 'GET_AUDIO_LIST_FAILED',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
