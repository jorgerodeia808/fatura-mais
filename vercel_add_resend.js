const https = require('https')
const fs = require('fs')

const TOKEN = 'vca_0a2D22tdhQP0IGWDpYTJe6BpdtJpWTMMah5RvPiiIcAQ5ohu1x46jc4v'
const TEAM_ID = 'team_uWfaXysBGptKdK2kUB1aTuVc'

const envContent = fs.readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (match) envVars[match[1]] = match[2]
})

const RESEND_KEY = envVars.RESEND_API_KEY
if (!RESEND_KEY) { console.error('RESEND_API_KEY not found in .env.local'); process.exit(1) }

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

async function addEnvVar(project, key, value) {
  const res = await apiRequest('POST', `/v10/projects/${project}/env`, {
    key,
    value,
    type: 'plain',
    target: ['production', 'preview', 'development'],
  })
  if (res.status === 200 || res.status === 201) {
    console.log(`  ✓ ${project}: ${key} added`)
  } else if (res.data.error?.code === 'ENV_ALREADY_EXISTS') {
    // Try to update it
    const listRes = await apiRequest('GET', `/v10/projects/${project}/env`)
    const existing = listRes.data.envs?.find(e => e.key === key)
    if (existing) {
      const upd = await apiRequest('PATCH', `/v10/projects/${project}/env/${existing.id}`, {
        value,
        target: ['production', 'preview', 'development'],
      })
      if (upd.status === 200 || upd.status === 201) {
        console.log(`  ✓ ${project}: ${key} updated`)
      } else {
        console.log(`  ⚠ ${project}: ${key} update failed: ${JSON.stringify(upd.data).slice(0, 100)}`)
      }
    }
  } else {
    console.error(`  ✗ ${project}: ${key}: ${JSON.stringify(res.data).slice(0, 100)}`)
  }
}

async function main() {
  console.log('Adding RESEND_API_KEY to both projects...')
  await addEnvVar('fatura-mais', 'RESEND_API_KEY', RESEND_KEY)
  await addEnvVar('fp-fatura-mais', 'RESEND_API_KEY', RESEND_KEY)
  console.log('\nDone. Triggering redeployments...')

  for (const proj of ['fatura-mais', 'fp-fatura-mais']) {
    const dep = await apiRequest('GET', `/v6/deployments?projectId=${proj}&limit=1`)
    const last = dep.data.deployments?.[0]
    if (!last) { console.log(`  ⚠ ${proj}: no deployment found`); continue }
    const r = await apiRequest('POST', '/v13/deployments', {
      name: proj,
      project: proj,
      target: 'production',
      gitSource: {
        type: 'github',
        repo: 'fatura-mais',
        ref: 'main',
        repoId: 1208169119,
      },
    })
    if (r.status === 200 || r.status === 201) {
      console.log(`  ✓ ${proj}: redeploy triggered — ${r.data.url}`)
    } else {
      console.log(`  ✗ ${proj}: ${JSON.stringify(r.data).slice(0, 100)}`)
    }
  }
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })
