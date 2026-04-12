import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  const protectedRoutes = [
    '/dashboard',
    '/onboarding',
    '/faturacao',
    '/despesas',
    '/marcacoes',
    '/relatorios',
    '/conselheiro-ia',
    '/configuracoes',
  ]
  const adminRoutes = ['/admin']
  const authRoutes = ['/login', '/registo']
  const pathname = request.nextUrl.pathname

  // ── Unauthenticated user hitting a protected or admin route ──────────────
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r))
  const isAdmin = adminRoutes.some((r) => pathname.startsWith(r))

  if (!user && (isProtected || isAdmin)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Authenticated user hitting auth routes → go to dashboard ────────────
  if (user && authRoutes.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // ── Admin route guard ────────────────────────────────────────────────────
  if (user && isAdmin) {
    // Use service role if available, fall back to anon key (anon key is fine
    // because admins table RLS already limits reads to admins).
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const adminClient = serviceKey
      ? createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceKey,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll()
              },
              setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                cookiesToSet.forEach(({ name, value }) =>
                  request.cookies.set(name, value)
                )
                cookiesToSet.forEach(({ name, value, options }) =>
                  supabaseResponse.cookies.set(name, value, options)
                )
              },
            },
          }
        )
      : supabase

    const { data: adminRow } = await adminClient
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRow) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // ── Plan / trial guard for protected app routes ──────────────────────────
  if (user && isProtected) {
    const { data: barbearia } = await supabase
      .from('barbearias')
      .select('plano, trial_termina_em')
      .eq('user_id', user.id)
      .maybeSingle()

    // Barbearia not yet created → user is in onboarding, allow through
    if (!barbearia) {
      return supabaseResponse
    }

    const { plano, trial_termina_em } = barbearia

    if (plano === 'vitalicio' || plano === 'mensal') {
      // Full access – pass through
      return supabaseResponse
    }

    if (plano === 'trial') {
      if (trial_termina_em) {
        const expiresAt = new Date(trial_termina_em)
        const now = new Date()

        if (expiresAt > now) {
          // Trial still active – attach days-remaining header
          const msRemaining = expiresAt.getTime() - now.getTime()
          const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))
          supabaseResponse.headers.set('x-trial-days', String(daysRemaining))
          return supabaseResponse
        }
      }

      // Trial expired or trial_termina_em is null
      const url = request.nextUrl.clone()
      url.pathname = '/acesso-expirado'
      return NextResponse.redirect(url)
    }

    if (plano === 'suspenso') {
      const url = request.nextUrl.clone()
      url.pathname = '/acesso-suspenso'
      return NextResponse.redirect(url)
    }

    // Unknown / null plano → treat same as expired trial
    const url = request.nextUrl.clone()
    url.pathname = '/acesso-expirado'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
