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
    const { audio_type, identifier, action, volume } = await req.json();

    if (!audio_type || !identifier || !action) {
      throw new Error('Missing required parameters: audio_type, identifier, action');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Find the audio track by friendly_name or ID
    let audioQuery = `${supabaseUrl}/rest/v1/music_library?`;
    
    if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // UUID format - search by ID
      audioQuery += `id=eq.${identifier}`;
    } else {
      // Search by friendly_name
      audioQuery += `friendly_name=eq.${identifier}`;
    }

    // Add category filter
    if (audio_type === 'jingle') {
      audioQuery += '&category=eq.jingle';
    } else if (audio_type === 'music') {
      audioQuery += '&category=eq.music';
    }

    const audioResponse = await fetch(audioQuery, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio track');
    }

    const audioData = await audioResponse.json();

    if (!audioData || audioData.length === 0) {
      throw new Error(`Audio not found: ${identifier}`);
    }

    const track = audioData[0];

    // Handle playlist type
    let playlistId = null;
    if (audio_type === 'playlist') {
      const playlistQuery = `${supabaseUrl}/rest/v1/playlists?name=eq.${identifier}`;
      const playlistResponse = await fetch(playlistQuery, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });

      if (playlistResponse.ok) {
        const playlistData = await playlistResponse.json();
        if (playlistData && playlistData.length > 0) {
          playlistId = playlistData[0].id;
        }
      }
    }

    // Get current playback state
    const stateResponse = await fetch(`${supabaseUrl}/rest/v1/audio_playback_state?limit=1`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    if (!stateResponse.ok) {
      throw new Error('Failed to fetch playback state');
    }

    const stateData = await stateResponse.json();
    const state = stateData[0];

    // Update playback state based on action
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    switch (action) {
      case 'play':
        updates.current_track_id = track.id;
        updates.is_playing = true;
        updates.playback_position = 0;
        if (playlistId) {
          updates.playlist_id = playlistId;
        }
        if (volume !== undefined && volume >= 0 && volume <= 1) {
          updates.volume = volume;
        }
        break;
      
      case 'pause':
        updates.is_playing = false;
        break;
      
      case 'stop':
        updates.is_playing = false;
        updates.playback_position = 0;
        break;
      
      default:
        throw new Error(`Invalid action: ${action}`);
    }

    // Update the playback state
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/audio_playback_state?id=eq.${state.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updates)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update playback state: ${errorText}`);
    }

    const updatedState = await updateResponse.json();

    return new Response(JSON.stringify({
      data: {
        success: true,
        message: `${action === 'play' ? 'Playing' : action === 'pause' ? 'Paused' : 'Stopped'} ${audio_type}: ${track.title || identifier}`,
        audio_id: track.id,
        now_playing: action === 'play' ? {
          id: track.id,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          friendly_name: track.friendly_name
        } : null,
        playback_state: updatedState[0]
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Play audio error:', error);

    const errorResponse = {
      error: {
        code: 'PLAY_AUDIO_FAILED',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
