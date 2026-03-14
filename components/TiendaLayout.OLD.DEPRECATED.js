'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Flower, Tag, ShoppingBag, User } from 'lucide-react'
import { ClienteAuthProvider, useClienteAuth } from '@/lib/cliente-auth'
import { CarritoProvider, useCarrito } from '@/lib/carrito-context'
import { CarritoSheet } from '@/components/CarritoSheet'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

function HeaderContent() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FCE7F3] py-3 shadow-sm">
      <div className="container flex items-center justify-center">
        <Link href="/tienda" className="flex flex-col items-center">
          <div className="relative w-14 h-14 mb-1">
            <Image
              src="/blooment-logo-final.png?v=3"
              alt="Blooment"
              fill
              className="object-contain"
              priority
              quality={100}
            />
          </div>
          <span className="text-base font-semibold text-[#F5B7C0]">Blooment</span>
        </Link>
      </div>
    </header>
  )
}

function BottomNav() {
  const pathname = usePathname()
  const { user } = useClienteAuth()
  const { getItemCount, toggleCart } = useCarrito()
  
  // Memoize cart count to avoid recalculation on every render
  const cartCount = useMemo(() => getItemCount(), [getItemCount])

  const navItems = useMemo(() => [
    { 
      name: 'Inicio', 
      href: '/tienda', 
      icon: Home,
      active: pathname === '/tienda'
    },
    { 
      name: 'Catálogo', 
      href: '/tienda/ocasiones', 
      icon: Flower,
      active: pathname === '/tienda/ocasiones'
    },
    { 
      name: 'Ofertas', 
      href: '/tienda/ofertas', 
      icon: Tag,
      active: pathname === '/tienda/ofertas'
    },
    { 
      name: 'Carrito', 
      href: '#', 
      icon: ShoppingBag,
      onClick: (e) => {
        e.preventDefault()
        toggleCart()
      },
      badge: cartCount
    },
    { 
      name: 'Cuenta', 
      href: user ? '/tienda/cuenta' : '/tienda/login', 
      icon: User,
      active: pathname === '/tienda/cuenta' || pathname === '/tienda/login' || pathname === '/tienda/register'
    },
  ], [pathname, user, cartCount, toggleCart])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#F5B7C0] border-t-4 border-[#F5B7C0] shadow-2xl">
      <div className="grid grid-cols-5 h-24 px-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.active
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center gap-2 transition-all duration-300 rounded-2xl mx-0.5 ${
                isActive 
                  ? 'bg-white text-[#F5B7C0] shadow-2xl scale-110 -translate-y-2 border-2 border-[#F5B7C0]' 
                  : 'text-white hover:bg-[#F5B7C0] hover:scale-105'
              }`}
            >
              <div className="relative flex-shrink-0">
                <Icon 
                  className={`${isActive ? 'w-7 h-7' : 'w-6 h-6'}`} 
                  strokeWidth={isActive ? 3 : 2} 
                />
                {item.badge > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] bg-[#F5B7C0] text-white border-2 border-white rounded-full font-bold"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-[11px] font-extrabold leading-none text-center w-full px-1 ${isActive ? 'scale-110' : ''}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
      {/* Safe area para dispositivos móviles */}
      <div className="h-[env(safe-area-inset-bottom)] min-h-[16px] bg-[#F5B7C0]"></div>
    </nav>
  )
}

export function TiendaLayout({ children }) {
  return (
    <ClienteAuthProvider>
      <CarritoProvider>
        <div className="min-h-screen bg-[#FCE7F3] pb-[140px]">
          <HeaderContent />
          <main className="pt-[120px] px-4 pb-8 min-h-screen">
            <div className="max-w-lg mx-auto">
              {children}
            </div>
          </main>
          <BottomNav />
          <CarritoSheet />
        </div>
      </CarritoProvider>
    </ClienteAuthProvider>
  )
}
