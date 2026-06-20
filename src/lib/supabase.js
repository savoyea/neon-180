import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Le mode "démo" permet de faire tourner l'app sans projet Supabase configuré.
// Dès que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont renseignés (.env),
// l'app bascule automatiquement sur le vrai backend.
export const isConfigured = Boolean(url && anonKey)

export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
