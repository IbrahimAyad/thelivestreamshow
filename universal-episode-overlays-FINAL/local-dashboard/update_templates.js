import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping of old local paths to new Supabase Storage URLs
const urlMappings = {
  '/imgs/alpha_wednesdays_template.png': 'https://vcniezwtltraqramjlux.supabase.co/storage/v1/object/public/media-library/alpha_wednesdays_template.png',
  '/imgs/live_stream_show_template.png': 'https://vcniezwtltraqramjlux.supabase.co/storage/v1/object/public/media-library/live_stream_show_template.png',
  '/imgs/brb_screen.png': 'https://vcniezwtltraqramjlux.supabase.co/storage/v1/object/public/media-library/brb_screen.png',
  '/imgs/starting_soon_screen.png': 'https://vcniezwtltraqramjlux.supabase.co/storage/v1/object/public/media-library/starting_soon_screen.png'
};

async function updateSceneTemplates() {
  try {
    console.log('🔄 Fetching all scene templates...');
    
    // Get all scene templates
    const { data: templates, error: fetchError } = await supabase
      .from('scene_templates')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error fetching templates:', fetchError);
      throw fetchError;
    }
    
    console.log(`✅ Found ${templates.length} templates\n`);
    
    let updatedCount = 0;
    
    for (const template of templates) {
      let needsUpdate = false;
      const updatedConfig = JSON.parse(JSON.stringify(template.config)); // Deep clone
      
      // Check if this template has sources with local paths
      if (updatedConfig.sources) {
        for (const source of updatedConfig.sources) {
          if (source.url && urlMappings[source.url]) {
            console.log(`🔧 Updating "${template.name}"`);
            console.log(`   Old: ${source.url}`);
            console.log(`   New: ${urlMappings[source.url]}`);
            source.url = urlMappings[source.url];
            needsUpdate = true;
          }
        }
      }
      
      if (needsUpdate) {
        // Update the template
        const { error: updateError } = await supabase
          .from('scene_templates')
          .update({ config: updatedConfig })
          .eq('id', template.id);
        
        if (updateError) {
          console.error(`❌ Error updating "${template.name}":`, updateError);
        } else {
          console.log(`✅ Successfully updated "${template.name}"\n`);
          updatedCount++;
        }
      }
    }
    
    console.log(`\n✨ COMPLETE! Updated ${updatedCount} scene templates.`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

updateSceneTemplates()
  .then(() => {
    console.log('✅ Update complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Update failed:', error);
    process.exit(1);
  });
