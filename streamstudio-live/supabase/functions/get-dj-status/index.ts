// AI Director API: Get current DJ state
// Returns playing status, current track, queue, and auto-dj status
// Note: This is a read-only endpoint that returns current state from database

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    // Fetch Auto-DJ settings
    const settingsResponse = await fetch(
      `${supabaseUrl}/rest/v1/auto_dj_settings?select=*&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    );

    let autoDjActive = false;
    let autoDjSettings = null;

    if (settingsResponse.ok) {
      const settings = await settingsResponse.json();
      if (settings && settings.length > 0) {
        autoDjSettings = settings[0];
        autoDjActive = autoDjSettings.enabled || false;
      }
    }

    // Fetch recent play history (last 10 tracks)
    const historyResponse = await fetch(
      `${supabaseUrl}/rest/v1/play_history?select=*&order=played_at.desc&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    );

    let recentTracks = [];
    let currentTrack = null;

    if (historyResponse.ok) {
      recentTracks = await historyResponse.json();
      if (recentTracks && recentTracks.length > 0) {
        // Most recent track is considered "current"
        const latestHistory = recentTracks[0];
        
        // Fetch track details
        const trackResponse = await fetch(
          `${supabaseUrl}/rest/v1/music_library?id=eq.${latestHistory.track_id}&select=*`,
          {
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
            },
          }
        );

        if (trackResponse.ok) {
          const tracks = await trackResponse.json();
          if (tracks && tracks.length > 0) {
            currentTrack = {
              id: tracks[0].id,
              title: tracks[0].title,
              artist: tracks[0].artist,
              friendly_name: tracks[0].friendly_name,
              bpm: tracks[0].bpm,
              musical_key: tracks[0].musical_key,
              played_at: latestHistory.played_at,
            };
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        dj_status: {
          auto_dj_active: autoDjActive,
          auto_dj_settings: autoDjActive ? {
            harmonic_mixing_enabled: autoDjSettings?.harmonic_mixing_enabled,
            bpm_matching_enabled: autoDjSettings?.bpm_matching_enabled,
            energy_progression: autoDjSettings?.energy_progression,
          } : null,
          current_track: currentTrack,
          recent_tracks_count: recentTracks.length,
          last_activity: recentTracks[0]?.played_at || null,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('get-dj-status error:', error);

    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message,
        dj_status: null,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
