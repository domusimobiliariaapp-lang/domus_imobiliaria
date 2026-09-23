import { createClient } from 'npm:@supabase/supabase-js@2.116.0'
import { AwsClient } from 'npm:aws4fetch@1.0.20'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)
  try {
    const authorization = req.headers.get('Authorization') || ''
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.replace(/^Bearer\s+/i, ''))
    if (authError || !user) return json({ error: 'Sessão inválida. Entre novamente.' }, 401)
    const { data: internal, error: roleError } = await supabase.rpc('is_internal_team')
    if (roleError || internal !== true) return json({ error: 'Apenas a equipe interna pode gerenciar arquivos.' }, 403)

    const names = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL']
    const missing = names.filter(name => !Deno.env.get(name))
    if (missing.length) return json({ error: `Configure os secrets da função: ${missing.join(', ')}` }, 503)
    const publicBase = new URL(Deno.env.get('R2_PUBLIC_URL')!)
    if (publicBase.protocol !== 'https:') return json({ error: 'R2_PUBLIC_URL deve usar HTTPS.' }, 503)
    const aws = new AwsClient({
      accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
      secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
      region: 'auto', service: 's3',
    })
    let body
    try { body = await req.json() } catch { return json({ error: 'JSON inválido.' }, 400) }
    if (!body || typeof body !== 'object') return json({ error: 'Requisição inválida.' }, 400)
    const { action = 'upload', fileName, fileType, folder = 'documents', fileSize } = body
    const endpoint = `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com/${Deno.env.get('R2_BUCKET_NAME')}`
    if (action === 'delete') {
      const key = body.key
      if (typeof key !== 'string' || !/^(images|videos|documents)\/[a-zA-Z0-9._-]+$/.test(key) || key.includes('..')) {
        return json({ error: 'Caminho de arquivo inválido.' }, 400)
      }
      const response = await aws.fetch(`${endpoint}/${key}`, { method: 'DELETE' })
      if (!response.ok) return json({ error: `Não foi possível excluir do R2 (HTTP ${response.status}).` }, 502)
      return json({ success: true })
    }
    if (action !== 'upload' || !['images', 'videos', 'documents'].includes(folder) || typeof fileName !== 'string' || !fileName.trim() || fileName.length > 255) {
      return json({ error: 'Nome, pasta ou operação inválidos.' }, 400)
    }
    const types: Record<string, string[]> = {
      images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif'],
      videos: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
      documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'],
    }
    if (!types[folder].includes(fileType)) return json({ error: 'Tipo de arquivo não permitido para esta pasta.' }, 400)
    const limit = (folder === 'videos' ? 50 : 10) * 1024 * 1024
    if (!Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > limit) return json({ error: `O arquivo deve ter entre 1 byte e ${limit / 1024 / 1024} MB.` }, 400)
    const key = `${folder}/${crypto.randomUUID()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const url = new URL(`${endpoint}/${key}`)
    url.searchParams.set('X-Amz-Expires', '300')
    const signed = await aws.sign(url, {
      method: 'PUT', headers: { 'Content-Type': fileType },
      aws: { signQuery: true, allHeaders: true },
    })
    return json({ uploadUrl: signed.url, key, publicUrl: `${publicBase.href.replace(/\/$/, '')}/${key}` })
  } catch (error) {
    console.error('Falha na integração R2:', error instanceof Error ? error.name : 'Erro desconhecido')
    return json({ error: 'Falha na integração R2. Verifique a configuração da função.' }, 500)
  }
})
