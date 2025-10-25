/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_AI_TAB?: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ENABLE_TTS?: string
  readonly VITE_ENABLE_BETABOT?: string
  readonly VITE_ENABLE_OBS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
