'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, UserPlus, Check, X, Eye, EyeOff, Shield, AlertTriangle, Crown } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/lib/auth-client'

const PERMISOS_DISPONIBLES = [
  { key: 'dashboard', label: 'Dashboard', description: 'Ver estadísticas generales' },
  { key: 'productos', label: 'Productos', description: 'Gestionar catálogo' },
  { key: 'pedidos', label: 'Pedidos', description: 'Ver y gestionar pedidos' },
  { key: 'clientes', label: 'Clientes', description: 'Ver información de clientes' },
  { key: 'cupones', label: 'Cupones', description: 'Crear y gestionar cupones' },
  { key: 'finanzas', label: 'Finanzas', description: 'Ver reportes financieros' },
]

export default function NuevoColaboradorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { getToken, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [superadminCount, setSuperadminCount] = useState(0)
  
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'colaborador', // 'colaborador' o 'superadmin'
    permisos: {
      dashboard: true,
      productos: true,
      pedidos: true,
      clientes: false,
      cupones: false,
      finanzas: false
    }
  })

  const isSuperAdmin = user?.rol === 'superadmin'
  const canAddSuperAdmin = isSuperAdmin && superadminCount < 4

  useEffect(() => {
    fetchSuperadminCount()
  }, [])

  const fetchSuperadminCount = async () => {
    try {
      const token = getToken()
      if (!token) return
      
      const res = await fetch('/api/security/admins', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const count = data.filter(a => a.rol === 'superadmin' && a.activo).length
        setSuperadminCount(count)
      }
    } catch (error) {
      console.error('Error fetching superadmin count:', error)
    }
  }

  // Verificar que sea superadmin
  if (user && !isSuperAdmin) {
    router.push('/admin')
    return null
  }

  const togglePermiso = (key) => {
    setForm({
      ...form,
      permisos: {
        ...form.permisos,
        [key]: !form.permisos[key]
      }
    })
  }

  const handleRolChange = (newRol) => {
    if (newRol === 'superadmin' && !canAddSuperAdmin) return
    setForm({ ...form, rol: newRol })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.nombre || !form.email || !form.password) {
      toast({ title: 'Error', description: 'Todos los campos son obligatorios', variant: 'destructive' })
      return
    }

    if (form.password.length < 6) {
      toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' })
      return
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      toast({ title: 'Error', description: 'Email inválido', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const token = getToken()
      
      // Permisos según rol
      const permisos = form.rol === 'superadmin' 
        ? JSON.stringify({ dashboard: true, productos: true, pedidos: true, clientes: true, cupones: true, finanzas: true, seguridad: true })
        : JSON.stringify(form.permisos)

      const res = await fetch('/api/security/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email.toLowerCase(),
          password: form.password,
          rol: form.rol,
          permisos: permisos
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: form.rol === 'superadmin' ? '✅ SuperAdmin creado' : '✅ Colaborador creado',
          description: `${form.nombre} ha sido agregado correctamente.`
        })
        setTimeout(() => router.push('/admin/security'), 1500)
      } else {
        toast({ title: 'Error', description: data.error || 'Error al crear usuario', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Header fijo */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <h1 className="font-bold text-lg">Nuevo Usuario</h1>
          <div className="w-20"></div>
        </div>
      </div>

      {/* Contenido con scroll */}
      <div className="p-4 pb-32">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
          
          {/* Selector de Tipo de Usuario */}
          <Card className="p-5">
            <h2 className="font-semibold mb-4 text-gray-800">Tipo de Usuario</h2>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Colaborador */}
              <button
                type="button"
                onClick={() => handleRolChange('colaborador')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  form.rol === 'colaborador'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-700">Colaborador</span>
                </div>
                <p className="text-xs text-gray-500">Acceso limitado según permisos</p>
              </button>

              {/* SuperAdmin */}
              <button
                type="button"
                onClick={() => handleRolChange('superadmin')}
                disabled={!canAddSuperAdmin}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  form.rol === 'superadmin'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!canAddSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-700">SuperAdmin</span>
                </div>
                <p className="text-xs text-gray-500">Acceso total al sistema</p>
              </button>
            </div>

            {/* Mensaje de límite */}
            {superadminCount >= 4 && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-700">Límite de SuperAdmins alcanzado (Máx. 4)</span>
              </div>
            )}

            {/* Contador de SuperAdmins */}
            {superadminCount < 4 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                SuperAdmins actuales: {superadminCount}/4
              </p>
            )}
          </Card>

          {/* Datos básicos */}
          <Card className="p-5">
            <h2 className="font-semibold mb-4 text-gray-800">Información del Usuario</h2>
            
            <div className="space-y-4">
              <div>
                <Label>Nombre Completo *</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({...form, nombre: e.target.value})}
                  placeholder="Ej: María López"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  placeholder="maria@ejemplo.com"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label>Contraseña * (mínimo 6 caracteres)</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Esta persona podrá cambiarla después</p>
              </div>
            </div>
          </Card>

          {/* Permisos (solo para colaboradores) */}
          {form.rol === 'colaborador' && (
            <Card className="p-5">
              <h2 className="font-semibold mb-4 text-gray-800">Permisos de Acceso</h2>
              <p className="text-sm text-gray-500 mb-4">Selecciona qué secciones puede ver este colaborador</p>
              
              <div className="space-y-3">
                {PERMISOS_DISPONIBLES.map((permiso) => (
                  <div
                    key={permiso.key}
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border-2 ${
                      form.permisos[permiso.key] 
                        ? 'bg-green-50 border-green-300' 
                        : 'bg-white border-gray-200'
                    }`}
                    onClick={() => togglePermiso(permiso.key)}
                  >
                    <div>
                      <p className="font-medium">{permiso.label}</p>
                      <p className="text-xs text-gray-500">{permiso.description}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      form.permisos[permiso.key] ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      {form.permisos[permiso.key] ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Info de SuperAdmin */}
          {form.rol === 'superadmin' && (
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-purple-700">Acceso Completo</p>
                  <p className="text-xs text-purple-600 mt-1">
                    Los SuperAdmins tienen acceso total a todas las secciones del panel, 
                    incluyendo Seguridad y Finanzas. No necesitas seleccionar permisos.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Nota de seguridad */}
          {form.rol === 'colaborador' && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-blue-700">Nota de Seguridad</p>
                  <p className="text-xs text-blue-600 mt-1">
                    El colaborador NO podrá acceder a la sección de Seguridad ni crear otros usuarios.
                    Solo podrá cambiar su propia contraseña.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </form>
      </div>

      {/* Botón fijo en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className={`flex-1 ${form.rol === 'superadmin' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? (
              'Creando...'
            ) : (
              <>
                {form.rol === 'superadmin' ? <Crown className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Crear {form.rol === 'superadmin' ? 'SuperAdmin' : 'Colaborador'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
