#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function downloadFinishHimAudio() {
  console.log('📥 Downloading mk_finish_him.mp3 from Supabase Storage...');
  
  try {
    // Download from music-audio bucket
    const { data, error } = await supabase.storage
      .from('music-audio')
      .download('mk_finish_him.mp3');
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error('No data received from Supabase');
    }
    
    // Convert blob to buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Save to public/audio directory
    const outputPath = join(__dirname, '..', 'public', 'audio', 'finish-him.mp3');
    writeFileSync(outputPath, buffer);
    
    console.log('✅ Audio file downloaded successfully!');
    console.log(`   Location: ${outputPath}`);
    console.log(`   Size: ${buffer.length} bytes`);
    
  } catch (error) {
    console.error('❌ Error downloading audio file:', error.message);
    process.exit(1);
  }
}

downloadFinishHimAudio();
