import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import BookingForm from './BookingForm'

interface PageProps {
  params: { slug: string }
}

export default async function AgendarPage({ params }: PageProps) {
  const supabase = createAdminClient()

  const { data: barbearia } = await supabase
    .from('barbearias')
    .select('id, nome, hora_abertura, hora_fecho')
    .eq('slug', params.slug)
    .eq('marcacoes_online', true)
    .single()

  if (!barbearia) notFound()

  const { data: servicos } = await supabase
    .from('servicos')
    .select('id, nome, preco, tempo_minutos')
    .eq('barbearia_id', barbearia.id)
    .eq('ativo', true)
    .order('nome')

  return (
    <div className="min-h-screen bg-[#fcf9f3]">
      {/* Header */}
      <div className="bg-[#0e4324] text-white py-8 px-4 text-center">
        <p className="text-white/60 text-sm mb-1">Marcação online</p>
        <h1 className="text-2xl font-serif font-bold">{barbearia.nome}</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <BookingForm
          slug={params.slug}
          barbeariaId={barbearia.id}
          horaAbertura={barbearia.hora_abertura ?? '09:00'}
          horaFecho={barbearia.hora_fecho ?? '19:00'}
          servicos={servicos ?? []}
        />
      </div>
    </div>
  )
}
