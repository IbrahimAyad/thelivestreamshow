// AI Director API: Get list of all saved mixes
// Returns available mixes with metadata

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

    // Parse query parameters for filtering
    const url = new URL(req.url);
    const isActive = url.searchParams.get('is_active');
    const limit = url.searchParams.get('limit') || '50';

    // Build query
    let query = `${supabaseUrl}/rest/v1/saved_mixes?select=*&order=created_at.desc&limit=${limit}`;
    
    if (isActive !== null) {
      query += `&is_active=eq.${isActive}`;
    }

    // Fetch saved mixes
    const mixesResponse = await fetch(query, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    });

    if (!mixesResponse.ok) {
      throw new Error('Failed to fetch mixes');
    }

    const mixes = await mixesResponse.json();

    // Format response
    const formattedMixes = mixes.map(mix => ({
      id: mix.id,
      name: mix.name,
      description: mix.description,
      tracks_count: mix.track_ids?.length || 0,
      duration_seconds: mix.duration_seconds,
      created_at: mix.created_at,
      is_active: mix.is_active,
    }));

    return new Response(
      JSON.stringify({
        status: 'success',
        count: formattedMixes.length,
        mixes: formattedMixes,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('get-mixes error:', error);

    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message,
        mixes: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
