'use client'

import React, { memo } from 'react'
import { TiendaHeader } from './TiendaHeader'
import { TiendaBottomNav } from './TiendaBottomNav'
import { CarritoProvider } from '@/lib/carrito-context'
import { ClienteAuthProvider } from '@/lib/cliente-auth'

function TiendaLayoutWrapperComponent({ children }) {
  return (
    <ClienteAuthProvider>
      <CarritoProvider>
        <div className="min-h-screen bg-white">
          <TiendaHeader />
          <main className="pt-20 pb-20">
            {children}
          </main>
          <TiendaBottomNav />
        </div>
      </CarritoProvider>
    </ClienteAuthProvider>
  )
}

// Memoizar para evitar re-renders innecesarios
export const TiendaLayoutWrapper = memo(TiendaLayoutWrapperComponent)
