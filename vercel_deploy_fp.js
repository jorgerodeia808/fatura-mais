const https = require('https')

const TOKEN = 'vca_0a2D22tdhQP0IGWDpYTJe6BpdtJpWTMMah5RvPiiIcAQ5ohu1x46jc4v'
const TEAM_ID = 'team_uWfaXysBGptKdK2kUB1aTuVc'
const REPO_ID = 1208169119

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
  console.log('Triggering production deployment for fp-fatura-mais...')
  const res = await apiRequest('POST', '/v13/deployments', {
    name: 'fp-fatura-mais',
    project: 'fp-fatura-mais',
    target: 'production',
    gitSource: {
      type: 'github',
      repo: 'fatura-mais',
      ref: 'main',
      repoId: REPO_ID,
    },
  })

  if (res.status === 200 || res.status === 201) {
    console.log('✓ Deployment triggered!')
    console.log('  URL:', `https://${res.data.url}`)
    console.log('  ID:', res.data.id)
    console.log('  State:', res.data.readyState || res.data.status)
  } else {
    console.error('✗ Failed:', JSON.stringify(res.data).slice(0, 400))
  }
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })
