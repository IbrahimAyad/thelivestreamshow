import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vcniezwtltraqramjlux.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ'
);

const { data, error } = await supabase
  .from('broadcast_graphics')
  .select('graphic_type, html_file')
  .order('graphic_type');

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log('\n📊 DATABASE GRAPHICS CHECK\n');
console.log('Total graphics in database:', data.length);
console.log('\nGraphics:');
data.forEach((g, i) => {
  console.log(`  ${(i+1).toString().padStart(2)}. ${g.graphic_type.padEnd(20)} -> ${g.html_file || 'NULL'}`);
});

const expected = [
  'starting_soon', 'brb', 'tech_difficulties', 'outro',
  'poll', 'milestone', 'chat_highlight',
  'award_show', 'finish_him', 'new_member', 'rage_meter', 'versus',
  'logo'
];

console.log('\n✅ VERIFICATION:');
const dbTypes = data.map(g => g.graphic_type);
expected.forEach(type => {
  const exists = dbTypes.includes(type);
  console.log(`  ${exists ? '✅' : '❌'} ${type}`);
});

process.exit(0);
