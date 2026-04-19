'use client'

import { useRouter } from 'next/navigation'
import RegistarPagamentoForm from './RegistarPagamentoForm'

export default function PagamentosClient() {
  const router = useRouter()

  return (
    <RegistarPagamentoForm onSuccess={() => router.refresh()} />
  )
}
