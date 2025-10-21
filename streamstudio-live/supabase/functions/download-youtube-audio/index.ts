Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { url, category, friendly_name } = await req.json();

        if (!url) {
            throw new Error('URL is required');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        // YouTube API key with proper fallback
        let youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
        if (!youtubeApiKey || youtubeApiKey.trim() === '') {
            youtubeApiKey = 'AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw';
        }

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing required Supabase environment variables');
        }

        console.log('Processing download request for:', url);

        const sourceType = detectSourceType(url);
        console.log('Detected source type:', sourceType);

        if (sourceType === 'youtube') {
            return await handleYouTubeDownload(url, category, friendly_name, supabaseUrl, serviceRoleKey, youtubeApiKey, corsHeaders);
        } else if (sourceType === 'direct') {
            return await handleDirectDownload(url, category, friendly_name, supabaseUrl, serviceRoleKey, corsHeaders);
        } else {
            throw new Error('Unsupported URL type');
        }

    } catch (error) {
        console.error('Download error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'DOWNLOAD_FAILED',
                message: error.message || 'Unknown error occurred'
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function detectSourceType(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'youtube';
    }
    if (url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        return 'direct';
    }
    return 'unknown';
}

function extractYouTubeVideoId(url: string): string | null {
    const match1 = url.match(/[?&]v=([^&]+)/);
    if (match1) return match1[1];
    const match2 = url.match(/youtu\.be\/([^?&]+)/);
    if (match2) return match2[1];
    return null;
}

async function handleYouTubeDownload(
    url: string,
    category: string,
    friendly_name: string | undefined,
    supabaseUrl: string,
    serviceRoleKey: string,
    youtubeApiKey: string,
    corsHeaders: Record<string, string>
) {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
        throw new Error('Invalid YouTube URL');
    }

    console.log('Video ID:', videoId);
    console.log('Fetching YouTube metadata...');
    
    const metadata = await fetchYouTubeMetadata(videoId, youtubeApiKey);
    console.log('Metadata fetched:', metadata.title);

    console.log('Downloading audio via Cobalt API...');
    const audioData = await downloadFromCobalt(url);

    if (!audioData) {
        throw new Error('Failed to download audio. Video may be restricted or service temporarily unavailable.');
    }

    console.log('Audio downloaded:', audioData.byteLength, 'bytes');

    const timestamp = Date.now();
    const fileName = `youtube-${videoId}-${timestamp}.mp3`;
    const storagePath = fileName;

    console.log('Uploading to storage:', storagePath);

    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/music-audio/${storagePath}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'audio/mpeg',
            'x-upsert': 'true'
        },
        body: audioData
    });

    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Upload failed: ${errorText}`);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/music-audio/${storagePath}`;

    const dbPayload = {
        title: metadata.title,
        artist: metadata.artist,
        duration: metadata.duration,
        file_url: publicUrl,
        file_size: audioData.byteLength,
        category: category || 'music',
        friendly_name: friendly_name || null,
        source_url: url,
        download_date: new Date().toISOString(),
        copyright_info: metadata.copyright_status
    };

    console.log('Saving to database...');

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/music_library`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(dbPayload)
    });

    if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        console.error('Database insert failed:', errorText);
        throw new Error(`Database insert failed: ${errorText}`);
    }

    const audioRecord = await insertResponse.json();
    console.log('Success! Record ID:', audioRecord[0].id);

    return new Response(JSON.stringify({
        data: {
            success: true,
            audio_id: audioRecord[0].id,
            metadata: {
                title: metadata.title,
                artist: metadata.artist,
                duration: metadata.duration,
                thumbnail: metadata.thumbnail,
                file_size: audioData.byteLength,
                copyright_status: metadata.copyright_status
            },
            file_url: publicUrl
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function downloadFromCobalt(youtubeUrl: string): Promise<ArrayBuffer | null> {
    try {
        console.log('Calling Cobalt API...');

        const response = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: youtubeUrl,
                isAudioOnly: true,
                aFormat: 'mp3'
            })
        });

        if (!response.ok) {
            console.error('Cobalt API error:', response.status);
            return null;
        }

        const result = await response.json();
        console.log('Cobalt response status:', result.status);
        
        if (result.status === 'stream' || result.status === 'redirect') {
            console.log('Downloading from URL...');
            const audioResponse = await fetch(result.url);
            if (audioResponse.ok) {
                return await audioResponse.arrayBuffer();
            }
        } else if (result.status === 'picker' && result.audio?.length > 0) {
            console.log('Multiple streams, using first...');
            const audioResponse = await fetch(result.audio[0].url);
            if (audioResponse.ok) {
                return await audioResponse.arrayBuffer();
            }
        }

        console.error('Unexpected Cobalt response:', result.status);
        return null;
    } catch (error) {
        console.error('Cobalt error:', error);
        return null;
    }
}

async function fetchYouTubeMetadata(videoId: string, apiKey: string) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${videoId}&key=${apiKey}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
        const errorText = await response.text();
        console.error('YouTube API error:', response.status, errorText);
        throw new Error(`YouTube API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
        throw new Error('Video not found');
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    const status = video.status;

    const duration = parseDuration(contentDetails.duration);
    const copyrightInfo = analyzeCopyrightStatus(snippet, contentDetails, status);

    return {
        title: snippet.title,
        artist: snippet.channelTitle,
        duration,
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
        copyright_status: copyrightInfo
    };
}

function parseDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
}

function analyzeCopyrightStatus(snippet: any, contentDetails: any, status: any) {
    const licensedContent = contentDetails.licensedContent || false;
    const embeddable = status.embeddable !== false;
    const title = (snippet.title || '').toLowerCase();
    const description = (snippet.description || '').toLowerCase();
    const hasCopyrightNotice = title.includes('copyright') || description.includes('copyright');

    let usage_policy = 'unknown';
    let playable_duration = null;
    let warning_message = '';

    if (licensedContent) {
        usage_policy = 'blocked';
        warning_message = 'Licensed content. Use at your own risk.';
    } else if (hasCopyrightNotice) {
        usage_policy = 'partial';
        playable_duration = 30;
        warning_message = 'Contains copyright notices. 30s preview only.';
    } else if (embeddable) {
        usage_policy = 'full';
    } else {
        usage_policy = 'blocked';
        warning_message = 'Embedding disabled. Use with caution.';
    }

    return {
        is_copyrighted: licensedContent || hasCopyrightNotice,
        safe_for_streaming: embeddable && !licensedContent,
        usage_policy,
        playable_duration,
        warning_message,
        license_type: licensedContent ? 'copyrighted' : 'unknown',
        last_checked: new Date().toISOString()
    };
}

async function handleDirectDownload(
    url: string,
    category: string,
    friendly_name: string | undefined,
    supabaseUrl: string,
    serviceRoleKey: string,
    corsHeaders: Record<string, string>
) {
    const audioResponse = await fetch(url);
    if (!audioResponse.ok) {
        throw new Error(`Failed to download: ${audioResponse.statusText}`);
    }

    const audioBlob = await audioResponse.arrayBuffer();
    const timestamp = Date.now();
    const extension = url.split('.').pop()?.split('?')[0] || 'mp3';
    const fileName = `direct-${timestamp}.${extension}`;

    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/music-audio/${fileName}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'audio/mpeg',
            'x-upsert': 'true'
        },
        body: audioBlob
    });

    if (!uploadResponse.ok) {
        throw new Error('Upload failed');
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/music-audio/${fileName}`;

    const dbPayload = {
        title: fileName,
        artist: 'Unknown',
        duration: 0,
        file_url: publicUrl,
        file_size: audioBlob.byteLength,
        category: category || 'music',
        friendly_name: friendly_name || null,
        source_url: url,
        download_date: new Date().toISOString(),
        copyright_info: {
            is_copyrighted: false,
            safe_for_streaming: true,
            usage_policy: 'unknown',
            warning_message: 'Direct download. Verify usage rights.'
        }
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/music_library`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(dbPayload)
    });

    if (!insertResponse.ok) {
        throw new Error('Database insert failed');
    }

    const audioData = await insertResponse.json();

    return new Response(JSON.stringify({
        data: {
            success: true,
            audio_id: audioData[0].id,
            file_url: publicUrl
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
