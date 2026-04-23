import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import nodemailer from 'nodemailer'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const em5Dias = new Date(now)
  em5Dias.setDate(em5Dias.getDate() + 5)

  const { data: barbearias } = await supabase
    .from('barbearias')
    .select('id, nome, subscricao_renovacao, user_id')
    .eq('plano', 'mensal')
    .gte('subscricao_renovacao', now.toISOString())
    .lte('subscricao_renovacao', em5Dias.toISOString())
    .order('subscricao_renovacao', { ascending: true })

  if (!barbearias || barbearias.length === 0) {
    return NextResponse.json({ ok: true, enviado: false, motivo: 'Sem renovações nos próximos 5 dias' })
  }

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const diasAte = (iso: string) => Math.ceil((new Date(iso).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  const linhas = barbearias.map(b =>
    `• ${b.nome} — renova em ${fmt(b.subscricao_renovacao!)} (${diasAte(b.subscricao_renovacao!)} dias)`
  ).join('\n')

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  })

  await transporter.sendMail({
    from: `"Fatura+" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `Fatura+ · ${barbearias.length} renovação(ões) nos próximos 5 dias`,
    html: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f5f0e8;">
  <div style="background:#0e4324;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">Fatura<span style="color:#c9a84c;">+</span></p>
    <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.6);">LEMBRETE DE RENOVAÇÕES</p>
  </div>
  <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;">
    <h2 style="margin:0 0 8px;font-size:18px;color:#1a1a1a;">
      ${barbearias.length} cliente${barbearias.length !== 1 ? 's renovam' : ' renova'} nos próximos 5 dias
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Confirma o pagamento e renova no painel admin.</p>
    <div style="background:#f9f7f2;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      ${barbearias.map(b => `
        <div style="padding:10px 0;border-bottom:1px solid #ede8df;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">${b.nome}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">
            Renova em ${fmt(b.subscricao_renovacao!)} · <strong style="color:#0e4324;">${diasAte(b.subscricao_renovacao!)} dia${diasAte(b.subscricao_renovacao!) !== 1 ? 's' : ''}</strong>
          </p>
        </div>
      `).join('')}
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/clientes"
       style="display:inline-block;background:#0e4324;color:#fff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
      Ir para o painel →
    </a>
  </div>
</div>`,
  })

  return NextResponse.json({ ok: true, enviado: true, clientes: barbearias.length })
}
