import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

async function hasValidInvite(email: string, nicho: string): Promise<boolean> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!serviceKey || !supabaseUrl) return false

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/pedidos_acesso?email=eq.${encodeURIComponent(email.toLowerCase())}&nicho=eq.${nicho}&estado=eq.convidado&limit=1&select=id`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    )
    if (!res.ok) return false
    const data = await res.json()
    return Array.isArray(data) && data.length > 0
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const hostname = request.headers.get('host') ?? ''
  const isAdminSubdomain = hostname.startsWith('admin.')

  if (isAdminSubdomain) {
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'jorgerodeia808@gmail.com')
      .split(',').map(e => e.trim().toLowerCase())
    const url = request.nextUrl.clone()
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      url.pathname = '/login'
      url.searchParams.set('erro', 'sem_acesso')
      return NextResponse.redirect(url)
    }
    if (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '') {
      url.pathname = '/admin/pedidos'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const isFP = process.env.NEXT_PUBLIC_APP_TYPE === 'fp'

  const protectedRoutes = isFP
    ? ['/dashboard', '/transacoes', '/recorrentes', '/orcamentos', '/objetivos', '/configuracoes', '/perfil']
    : ['/dashboard', '/bem-vindo', '/onboarding', '/faturacao', '/despesas', '/marcacoes', '/relatorios', '/conselheiro-ia', '/configuracoes', '/perfil']

  const adminRoutes = ['/admin']
  const authRoutes = ['/login']
  const pathname = request.nextUrl.pathname

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r))
  const isAdmin = adminRoutes.some((r) => pathname.startsWith(r))

  if (!user && (isProtected || isAdmin)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && authRoutes.some((r) => pathname.startsWith(r))) {
    // Se o utilizador autenticado não tem acesso, deixar a página de login renderizar
    // com o erro — evita o loop infinito /login?sem_acesso ↔ /dashboard?sem_acesso
    if (request.nextUrl.searchParams.get('erro') === 'sem_acesso') {
      return supabaseResponse
    }

    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'jorgerodeia808@gmail.com')
      .split(',').map(e => e.trim().toLowerCase())
    const url = request.nextUrl.clone()
    url.search = '' // limpar query params do clone para não propagar ?erro=...
    url.pathname = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
      ? '/admin/pedidos'
      : '/dashboard'
    return NextResponse.redirect(url)
  }

  // ── Admin route guard: email allowlist ──────────────────────────────────
  if (user && isAdmin) {
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'jorgerodeia808@gmail.com')
      .split(',')
      .map((e) => e.trim().toLowerCase())

    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // ── Plan guard — FP+ ─────────────────────────────────────────────────────
  if (user && isProtected && isFP) {
    const { data: perfil } = await supabase
      .from('fp_perfis')
      .select('plano, subscricao_renovacao')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!perfil) {
      const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'jorgerodeia808@gmail.com')
        .split(',').map(e => e.trim().toLowerCase())
      const isAdminUser = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())

      if (!isAdminUser) {
        // Usar service role para bypassar RLS na verificação do convite
        const convite = await hasValidInvite(user.email ?? '', 'fp')

        if (!convite) {
          const url = request.nextUrl.clone()
          url.search = ''
          url.pathname = '/login'
          url.searchParams.set('erro', 'sem_acesso')
          return NextResponse.redirect(url)
        }
      }

      if (isAdminUser) return supabaseResponse

      if (pathname === '/onboarding') return supabaseResponse
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    if (perfil.plano === 'vitalicio') return supabaseResponse

    if (perfil.plano === 'mensal') {
      const renovacao = perfil.subscricao_renovacao as string | null
      if (!renovacao || new Date(renovacao) >= new Date()) return supabaseResponse
      const url = request.nextUrl.clone()
      url.pathname = '/acesso-suspenso'
      url.searchParams.set('motivo', 'expirado')
      url.searchParams.set('renovacao', renovacao)
      return NextResponse.redirect(url)
    }

    const url = request.nextUrl.clone()
    url.pathname = '/acesso-suspenso'
    url.searchParams.set('motivo', 'suspenso')
    return NextResponse.redirect(url)
  }

  // ── Plan guard — Nicho ───────────────────────────────────────────────────
  if (user && isProtected && !isFP) {
    const { data: barbearia } = await supabase
      .from('barbearias')
      .select('plano, subscricao_renovacao')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!barbearia) {
      const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'jorgerodeia808@gmail.com')
        .split(',').map(e => e.trim().toLowerCase())
      const isAdminUser = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())

      if (!isAdminUser) {
        // Usar service role para bypassar RLS na verificação do convite
        const nicho = process.env.NEXT_PUBLIC_APP_TYPE ?? 'barbeiro'
        const convite = await hasValidInvite(user.email ?? '', nicho)

        if (!convite) {
          const url = request.nextUrl.clone()
          url.search = ''
          url.pathname = '/login'
          url.searchParams.set('erro', 'sem_acesso')
          return NextResponse.redirect(url)
        }
      }

      if (isAdminUser) return supabaseResponse

      if (pathname === '/onboarding' || pathname === '/bem-vindo') return supabaseResponse
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    if (barbearia.plano === 'vitalicio') return supabaseResponse

    if (barbearia.plano === 'mensal') {
      const renovacao = barbearia.subscricao_renovacao as string | null
      if (!renovacao || new Date(renovacao) >= new Date()) return supabaseResponse
      const url = request.nextUrl.clone()
      url.pathname = '/acesso-suspenso'
      url.searchParams.set('motivo', 'expirado')
      url.searchParams.set('renovacao', renovacao)
      return NextResponse.redirect(url)
    }

    const url = request.nextUrl.clone()
    url.pathname = '/acesso-suspenso'
    url.searchParams.set('motivo', 'suspenso')
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
