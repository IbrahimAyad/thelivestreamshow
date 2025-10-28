import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const CHARACTER_TEST_MESSAGES = [
  {
    topic: 'Alpha',
    question_text: 'Warning: Alpha levels are rising. If you\'re not ready, please log off and go journal.',
    position: 1
  },
  {
    topic: 'AZ',
    question_text: 'AZ says this take is worse than your fantasy football team. And that team went 0–12.',
    position: 2
  },
  {
    topic: 'Sylvester',
    question_text: 'This next comment has been cleared by legal. You\'re welcome, chat.',
    position: 3
  },
  {
    topic: 'Rattlesnake',
    question_text: 'That last take was so cold, even Rattlesnake wouldn\'t touch it. And he eats frozen pizza.',
    position: 4
  },
  {
    topic: 'Dr. MindEye',
    question_text: 'After careful examination, Dr. MindEye has confirmed… you need therapy.',
    position: 5
  },
  {
    topic: 'Vic Nasty',
    question_text: 'Brace yourselves, Vic Nasty just walked in. We\'re about to get demonetized.',
    position: 6
  },
  {
    topic: 'Gio',
    question_text: 'Gio owns more properties than you have unread emails. Sit down.',
    position: 7
  },
  {
    topic: 'Emgo Billups',
    question_text: 'JJ Marcharty isn\'t on the screen, but Emgo is still yelling about him.',
    position: 8
  },
  {
    topic: 'Ole Duit',
    question_text: 'Ole Duit says buy the dip. Of what? Doesn\'t matter. Just buy.',
    position: 9
  },
  {
    topic: 'Abe',
    question_text: 'Abe just lost in Warzone again. That makes 7 in a row. Keep your thoughts and prayers coming.',
    position: 10
  }
]

async function addCharacterMessages() {
  console.log('🎭 Adding character test messages...')

  for (const message of CHARACTER_TEST_MESSAGES) {
    const { data, error } = await supabase
      .from('show_questions')
      .insert({
        ...message,
        tts_generated: false,
        show_on_overlay: false
      })

    if (error) {
      console.error(`❌ Error adding ${message.topic}:`, error)
    } else {
      console.log(`✅ Added ${message.topic}: "${message.question_text.substring(0, 50)}..."`)
    }
  }

  console.log('\n🎉 All character messages added!')
  console.log('📝 You can now test them from the Popup Queue Panel')
}

addCharacterMessages()
