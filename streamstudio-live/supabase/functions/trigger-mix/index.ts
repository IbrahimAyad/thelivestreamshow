// AI Director API: Trigger a saved mix by ID
// Returns mix details and track information for playback

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
    const { mix_id } = await req.json();

    if (!mix_id) {
      throw new Error('mix_id is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    // Fetch the saved mix
    const mixResponse = await fetch(
      `${supabaseUrl}/rest/v1/saved_mixes?id=eq.${mix_id}&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    );

    if (!mixResponse.ok) {
      throw new Error('Failed to fetch mix');
    }

    const mixes = await mixResponse.json();

    if (!mixes || mixes.length === 0) {
      throw new Error(`Mix with ID ${mix_id} not found`);
    }

    const mix = mixes[0];

    // Fetch track details for the mix
    const trackIds = mix.track_ids || [];
    
    if (trackIds.length === 0) {
      throw new Error('Mix has no tracks');
    }

    // Build query to fetch all tracks
    const trackIdsQuery = trackIds.map(id => `id.eq.${id}`).join(',');
    const tracksResponse = await fetch(
      `${supabaseUrl}/rest/v1/music_library?or=(${trackIdsQuery})&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    );

    if (!tracksResponse.ok) {
      throw new Error('Failed to fetch tracks');
    }

    const tracks = await tracksResponse.json();

    // Sort tracks according to the order in track_ids
    const orderedTracks = trackIds
      .map(id => tracks.find(t => t.id === id))
      .filter(Boolean);

    return new Response(
      JSON.stringify({
        status: 'success',
        message: `Mix "${mix.name}" ready to play`,
        mix_info: {
          id: mix.id,
          name: mix.name,
          description: mix.description,
          duration_seconds: mix.duration_seconds,
          track_count: orderedTracks.length,
          tracks: orderedTracks.map(track => ({
            id: track.id,
            title: track.title,
            artist: track.artist,
            file_path: track.file_path,
            friendly_name: track.friendly_name,
            duration: track.duration,
            bpm: track.bpm,
            musical_key: track.musical_key,
          })),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('trigger-mix error:', error);

    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message,
        mix_info: null,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
