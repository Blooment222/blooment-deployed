'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users,
  CreditCard,
  Menu,
  X,
  Flower2,
  LogOut,
  Shield,
  Ticket,
  TrendingUp,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AuthProvider, useAuth } from '@/lib/auth-client'

function AdminLayoutContent({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout } = useAuth()

  // Definir items de navegación con sus permisos requeridos
  const allNavItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, permiso: 'dashboard' },
    { name: 'Productos', href: '/admin/productos', icon: Package, permiso: 'productos' },
    { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart, permiso: 'pedidos' },
    { name: 'Clientes', href: '/admin/clientes', icon: Users, permiso: 'clientes' },
    { name: 'Cupones', href: '/admin/cupones', icon: Ticket, permiso: 'cupones' },
    { name: 'Finanzas', href: '/admin/finanzas', icon: TrendingUp, permiso: 'finanzas' },
    { name: 'Seguridad', href: '/admin/security', icon: Shield, permiso: 'seguridad', soloSuperadmin: true },
    { name: 'Mi Cuenta', href: '/admin/mi-cuenta', icon: User, permiso: null }, // Visible para todos
  ]

  // Parsear permisos del usuario
  const getUserPermisos = () => {
    if (!user) return {}
    if (user.rol === 'superadmin') {
      return { dashboard: true, productos: true, pedidos: true, clientes: true, cupones: true, finanzas: true, seguridad: true }
    }
    try {
      return JSON.parse(user.permisos || '{}')
    } catch {
      return {}
    }
  }

  const permisos = getUserPermisos()
  const isSuperAdmin = user?.rol === 'superadmin'

  // Filtrar items de navegación según permisos
  const navItems = allNavItems.filter(item => {
    if (item.permiso === null) return true // Visible para todos (Mi Cuenta)
    if (item.soloSuperadmin && !isSuperAdmin) return false
    if (isSuperAdmin) return true
    return permisos[item.permiso]
  })

  // Si estamos en la página de login, renderizar directamente sin layout
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.push('/admin/login')
    }
  }, [user, loading, router, isLoginPage])

  // Si es la página de login, renderizar sin el layout del admin
  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-card border-r">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image
                  src="/blooment-logo-final.png?v=3"
                  alt="Blooment"
                  fill
                  className="object-contain"
                  priority
                  quality={100}
                />
              </div>
              <span className="font-bold text-lg">Blooment Admin</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-73px)]">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#F5B6C6] text-[#F5B6C6]-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  logout()
                  setSidebarOpen(false)
                }}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Cerrar Sesión
              </Button>
            </div>
          </ScrollArea>
        </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 border-r bg-card">
          <div className="flex items-center gap-3 p-6 border-b">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src="/blooment-logo-final.png?v=3"
                alt="Blooment"
                fill
                className="object-contain"
                priority
                quality={100}
              />
            </div>
            <div>
              <h1 className="font-bold text-lg">Blooment</h1>
              <p className="text-xs text-gray-500">Panel Admin</p>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#F5B6C6] text-[#F5B6C6]-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="mb-4 p-3 bg-pink-50 rounded-lg border border-pink-100">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-[#F5B6C6]" />
                <span className="font-medium text-gray-700">{user.email}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={logout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-40 flex items-center gap-x-4 bg-card border-b px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-1 text-sm font-semibold">Blooment Admin</div>
        </div>

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  )
}
