import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'

// Rota de teste — só funciona em desenvolvimento
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ erro: 'Apenas disponível em desenvolvimento' }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
    }

    const { numero, mensagem } = await req.json()

    if (!numero?.trim()) {
      return NextResponse.json({ erro: 'Número obrigatório' }, { status: 400 })
    }

    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!sid || !token || !fromNumber) {
      return NextResponse.json({ erro: 'Twilio não configurado. Verifica TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_PHONE_NUMBER no .env.local' }, { status: 503 })
    }

    const client = twilio(sid, token)
    const msg = await client.messages.create({
      body: mensagem || '✅ SMS de teste da plataforma Fatura+. O teu Twilio está configurado corretamente!',
      from: fromNumber,
      to: numero.trim(),
    })

    return NextResponse.json({ sucesso: true, sid: msg.sid, estado: msg.status })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Erro no SMS de teste:', msg)
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
