const https = require('https')

const TOKEN = 'vca_0a2D22tdhQP0IGWDpYTJe6BpdtJpWTMMah5RvPiiIcAQ5ohu1x46jc4v'
const TEAM_ID = 'team_uWfaXysBGptKdK2kUB1aTuVc'

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null
    const url = `https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${TEAM_ID}`
    const parsed = new URL(url)
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, data }) }
      })
    })
    req.on('error', reject)
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

async function main() {
  // 1. Get existing project to find GitHub repo
  console.log('1. Fetching existing project info...')
  const existing = await apiRequest('GET', '/v9/projects/fatura-mais')
  if (existing.status !== 200) {
    console.error('Failed to get existing project:', existing.data)
    return
  }
  const link = existing.data.link
  console.log('   Repo:', link?.repo, '| Type:', link?.type, '| RepoId:', link?.repoId)

  // 2. Create new FP+ project
  console.log('\n2. Creating fp-fatura-mais project...')
  const createBody = {
    name: 'fp-fatura-mais',
    framework: 'nextjs',
    ...(link?.type === 'github' ? {
      gitRepository: {
        repo: link.repo,
        type: 'github',
      }
    } : {}),
  }
  const created = await apiRequest('POST', '/v10/projects', createBody)
  if (created.status === 200 || created.status === 201) {
    console.log('   ✓ Project created:', created.data.name, '| ID:', created.data.id)
  } else if (created.data.error?.code === 'project_already_exists') {
    console.log('   ⚠ Project already exists, continuing...')
  } else {
    console.error('   ✗ Failed to create project:', JSON.stringify(created.data))
    return
  }

  // 3. Set environment variables
  console.log('\n3. Setting environment variables...')

  // Read Supabase vars from .env.local
  const fs = require('fs')
  const envContent = fs.readFileSync('.env.local', 'utf8')
  const envVars = {}
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (match && !match[2].includes('SUBSTITUI')) {
      envVars[match[1]] = match[2]
    }
  })

  const fpEnvVars = [
    { key: 'NEXT_PUBLIC_APP_TYPE',          value: 'fp',                                    target: ['production', 'preview', 'development'] },
    { key: 'NEXT_PUBLIC_SUPABASE_URL',      value: envVars.NEXT_PUBLIC_SUPABASE_URL,        target: ['production', 'preview', 'development'] },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,   target: ['production', 'preview', 'development'] },
    { key: 'SUPABASE_SERVICE_ROLE_KEY',     value: envVars.SUPABASE_SERVICE_ROLE_KEY,       target: ['production', 'preview', 'development'] },
    { key: 'ANTHROPIC_API_KEY',             value: envVars.ANTHROPIC_API_KEY,               target: ['production', 'preview', 'development'] },
    { key: 'NEXT_PUBLIC_APP_URL',           value: 'https://fp.fatura-mais.pt',             target: ['production', 'preview', 'development'] },
  ]

  for (const envVar of fpEnvVars) {
    if (!envVar.value) { console.log(`   ⚠ Skipped ${envVar.key} (no value)`); continue }
    const res = await apiRequest('POST', '/v10/projects/fp-fatura-mais/env', {
      key: envVar.key,
      value: envVar.value,
      type: 'plain',
      target: envVar.target,
    })
    if (res.status === 200 || res.status === 201) {
      console.log(`   ✓ ${envVar.key}`)
    } else if (res.data.error?.code === 'ENV_ALREADY_EXISTS') {
      console.log(`   ⚠ ${envVar.key} already exists`)
    } else {
      console.error(`   ✗ ${envVar.key}:`, JSON.stringify(res.data))
    }
  }

  // 4. Trigger a deployment
  console.log('\n4. Triggering initial deployment...')
  const deployRes = await apiRequest('POST', '/v13/deployments', {
    name: 'fp-fatura-mais',
    project: 'fp-fatura-mais',
    target: 'production',
    gitSource: link?.type === 'github' ? {
      type: 'github',
      repo: link.repo,
      ref: 'main',
    } : undefined,
  })

  if (deployRes.status === 200 || deployRes.status === 201) {
    console.log('   ✓ Deployment triggered!')
    console.log('   URL:', deployRes.data.url)
    console.log('   ID:', deployRes.data.id)
  } else {
    console.error('   ✗ Deployment failed:', JSON.stringify(deployRes.data).slice(0, 200))
  }

  console.log('\nDone! Check https://vercel.com/jorgerodeia808s-projects/fp-fatura-mais')
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })
