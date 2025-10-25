import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadGraphic(filePath, metadata) {
  try {
    console.log(`\n📤 Uploading ${filePath}...`);
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media-library')
      .upload(fileName, fileBuffer, {
        contentType: metadata.type,
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw uploadError;
    }
    
    console.log('✅ File uploaded:', uploadData.path);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media-library')
      .getPublicUrl(fileName);
    
    console.log('🔗 Public URL:', publicUrl);
    
    // Insert record into media_library table
    const { data: dbData, error: dbError } = await supabase
      .from('media_library')
      .insert({
        name: metadata.name,
        type: metadata.type,
        file_url: publicUrl,
        thumbnail_url: publicUrl,
        category: metadata.category,
        show_id: metadata.show_id,
        tags: metadata.tags || [],
        duration: null
      })
      .select();
    
    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw dbError;
    }
    
    console.log('✅ Database record created:', dbData[0]);
    console.log('\n✨ SUCCESS! Graphic uploaded and cataloged.\n');
    
    return { publicUrl, dbRecord: dbData[0] };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Upload starting_soon_screen.png
const metadata = {
  name: 'Starting Soon Screen',
  type: 'image/png',
  category: 'emergency_screen',
  show_id: null, // General purpose screen
  tags: ['starting_soon', 'pre_stream', 'countdown']
};

uploadGraphic('../imgs/starting_soon_screen.png', metadata)
  .then(() => {
    console.log('✅ Upload complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  });
