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
    '/bem-vindo',
    '/onboarding',
    '/faturacao',
    '/despesas',
    '/marcacoes',
    '/relatorios',
    '/conselheiro-ia',
    '/configuracoes',
    '/perfil',
  ]
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
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
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

  // ── Plan guard for protected app routes ──────────────────────────────────
  if (user && isProtected) {
    const { data: barbearia } = await supabase
      .from('barbearias')
      .select('plano, subscricao_renovacao')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!barbearia) {
      if (pathname === '/onboarding' || pathname === '/bem-vindo') return supabaseResponse
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    if (barbearia.plano === 'vitalicio') {
      return supabaseResponse
    }

    if (barbearia.plano === 'mensal') {
      const renovacao = barbearia.subscricao_renovacao as string | null
      if (renovacao && new Date(renovacao) >= new Date()) {
        return supabaseResponse
      }
      const url = request.nextUrl.clone()
      url.pathname = '/acesso-suspenso'
      url.searchParams.set('motivo', 'expirado')
      if (renovacao) url.searchParams.set('renovacao', renovacao)
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
