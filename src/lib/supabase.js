import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

const TRIP_KEY = 'europe-2026'
const BACKUP_TABLE = 'europe_trip_backups'
const TICKET_TABLE = 'europe_trip_tickets'
const TICKET_BUCKET = 'europe-trip-tickets'

function requireClient() {
  if (!supabase) throw new Error('Supabase 연결 정보가 설정되지 않았어요.')
  return supabase
}

async function requireUser() {
  const client = requireClient()
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new Error('먼저 이메일로 로그인해 주세요.')
  return data.user
}

export async function sendMagicLink(email) {
  const client = requireClient()
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOutLocal() {
  const client = requireClient()
  const { error } = await client.auth.signOut({ scope: 'local' })
  if (error) throw error
}

export async function backupTrip(payload) {
  const client = requireClient()
  const user = await requireUser()
  const { data, error } = await client
    .from(BACKUP_TABLE)
    .upsert({ user_id: user.id, trip_key: TRIP_KEY, payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id,trip_key' })
    .select('updated_at')
    .single()
  if (error) throw error
  return data
}

export async function restoreTrip() {
  const client = requireClient()
  const user = await requireUser()
  const { data, error } = await client
    .from(BACKUP_TABLE)
    .select('payload,updated_at')
    .eq('user_id', user.id)
    .eq('trip_key', TRIP_KEY)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('저장된 클라우드 백업이 아직 없어요.')
  return data
}

export async function uploadTicket({ file, title, city, eventDate }) {
  const client = requireClient()
  const user = await requireUser()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-')
  const storagePath = `${user.id}/${Date.now()}-${safeName}`
  const { error: uploadError } = await client.storage.from(TICKET_BUCKET).upload(storagePath, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data, error } = await client.from(TICKET_TABLE).insert({
    user_id: user.id,
    title,
    city,
    event_date: eventDate || null,
    file_name: file.name,
    storage_path: storagePath,
    mime_type: file.type || null,
  }).select().single()

  if (error) {
    await client.storage.from(TICKET_BUCKET).remove([storagePath])
    throw error
  }
  return data
}

export async function fetchTickets() {
  const client = requireClient()
  const user = await requireUser()
  const { data, error } = await client
    .from(TICKET_TABLE)
    .select('*')
    .eq('user_id', user.id)
    .order('event_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data || []
}

export async function getTicketUrl(storagePath) {
  const client = requireClient()
  await requireUser()
  const { data, error } = await client.storage.from(TICKET_BUCKET).createSignedUrl(storagePath, 300)
  if (error) throw error
  return data.signedUrl
}

export async function translateTravelText(text, targetLanguage) {
  const client = requireClient()
  await requireUser()
  const { data, error } = await client.functions.invoke('translate-travel-text', {
    body: { text, targetLanguage },
  })
  if (error) throw error
  if (!data?.english || !data?.translated) throw new Error(data?.error || '번역 결과를 불러오지 못했어요.')
  return data
}

export async function fetchTranslationUsage() {
  const client = requireClient()
  const user = await requireUser()
  const month = new Date().toISOString().slice(0, 7) + '-01'
  const { data, error } = await client
    .from('europe_trip_translation_usage')
    .select('char_count')
    .eq('user_id', user.id)
    .eq('usage_month', month)
    .maybeSingle()
  if (error) throw error
  return Number(data?.char_count || 0)
}
