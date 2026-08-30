import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const targetCodes: Record<string, string> = { es: 'ES', pt: 'PT', it: 'IT', el: 'EL', fi: 'FI' }

async function googleTranslate(apiKey: string, text: string, target: string) {
  const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
    body: JSON.stringify({ q: text, source: 'ko', target, format: 'text' }),
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload?.error?.message || 'Google 번역 요청에 실패했습니다.')
  return payload?.data?.translations?.[0]?.translatedText as string | undefined
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization) throw new Error('로그인이 필요합니다.')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const googleApiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY')
    if (!googleApiKey) throw new Error('Google 번역 키가 설정되지 않았습니다.')

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) throw new Error('로그인 정보를 확인할 수 없습니다.')

    const { text, targetLanguage } = await req.json()
    const source = String(text || '').trim()
    const target = targetCodes[String(targetLanguage || '')]
    if (!source) throw new Error('번역할 문장을 입력해 주세요.')
    if (!target) throw new Error('지원하지 않는 번역 언어입니다.')
    if (Array.from(source).length > 5000) throw new Error('한 번에 5,000자까지 번역할 수 있습니다.')

    const chargedCharacters = Array.from(source).length * 2
    const usageMonth = new Date().toISOString().slice(0, 7) + '-01'
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    const { data: usage, error: usageError } = await admin.rpc('increment_europe_trip_translation_usage', {
      p_user_id: user.id,
      p_usage_month: usageMonth,
      p_char_count: chargedCharacters,
    })
    if (usageError) {
      if (usageError.message?.includes('MONTHLY_TRANSLATION_LIMIT_EXCEEDED')) throw new Error('이번 달 번역 한도 500,000자를 모두 사용했어요.')
      throw usageError
    }

    const [english, translated] = await Promise.all([
      googleTranslate(googleApiKey, source, 'EN'),
      googleTranslate(googleApiKey, source, target),
    ])
    if (!english || !translated) throw new Error('번역 결과가 비어 있습니다.')

    return Response.json({ english, translated, usage: Number(usage || 0) }, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : '번역 중 오류가 발생했습니다.' }, {
      status: 400,
      headers: corsHeaders,
    })
  }
})
