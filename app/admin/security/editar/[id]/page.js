'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Check, X, Shield, AlertTriangle } from 'lucide-react'
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

// Emails protegidos que solo pueden auto-eliminarse
const EMAILS_FUNDADORES = ['diegoah1107@gmail.com', 'maireyesguevara@gmail.com']

export default function EditarColaboradorPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { getToken, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [colaborador, setColaborador] = useState(null)
  const [superadminCount, setSuperadminCount] = useState(0)
  
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    rol: 'colaborador',
    permisos: {
      dashboard: true,
      productos: true,
      pedidos: true,
      clientes: false,
      cupones: false,
      finanzas: false
    }
  })

  useEffect(() => {
    if (params?.id) {
      fetchColaborador()
      fetchSuperadminCount()
    }
  }, [params?.id])

  const fetchColaborador = async () => {
    try {
      const token = getToken()
      const res = await fetch(`/api/security/admins/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setColaborador(data)
        
        let permisos = { dashboard: true, productos: true, pedidos: true, clientes: false, cupones: false, finanzas: false }
        try {
          permisos = JSON.parse(data.permisos || '{}')
        } catch {}
        
        setForm({
          nombre: data.nombre,
          email: data.email,
          rol: data.rol || 'colaborador',
          permisos
        })
      } else {
        toast({ title: 'Error', description: 'No se pudo cargar el colaborador', variant: 'destructive' })
        router.push('/admin/security')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuperadminCount = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/security/admins', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const count = data.filter(a => a.rol === 'superadmin' && a.activo).length
        setSuperadminCount(count)
      }
    } catch {}
  }

  // Verificaciones de permisos
  const isFundador = user && EMAILS_FUNDADORES.includes(user.email?.toLowerCase())
  const isSuperAdmin = user?.rol === 'superadmin'
  const isEditingSuperAdmin = colaborador?.rol === 'superadmin'
  const isEditingFundador = colaborador && EMAILS_FUNDADORES.includes(colaborador.email?.toLowerCase())
  const canPromoteToSuperAdmin = isSuperAdmin && superadminCount < 4 && !isEditingSuperAdmin
  const canEdit = isSuperAdmin && (!isEditingSuperAdmin || (isEditingFundador && isFundador && user?.email?.toLowerCase() === colaborador?.email?.toLowerCase()))

  const togglePermiso = (key) => {
    if (!canEdit) return
    setForm({
      ...form,
      permisos: {
        ...form.permisos,
        [key]: !form.permisos[key]
      }
    })
  }

  const handleRolChange = (newRol) => {
    if (!canPromoteToSuperAdmin && newRol === 'superadmin') return
    setForm({ ...form, rol: newRol })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!canEdit) {
      toast({ title: 'Error', description: 'No tienes permisos para editar este usuario', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/security/admins/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: form.nombre,
          rol: form.rol,
          permisos: JSON.stringify(form.permisos)
        })
      })

      if (res.ok) {
        toast({
          title: '✅ Cambios guardados',
          description: `Los permisos de ${form.nombre} han sido actualizados.`
        })
        setTimeout(() => router.push('/admin/security'), 1500)
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Error al guardar', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!colaborador) {
    return null
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
          <h1 className="font-bold text-lg">Editar Usuario</h1>
          <div className="w-20"></div>
        </div>
      </div>

      {/* Contenido con scroll */}
      <div className="p-4 pb-32">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
          
          {/* Aviso si es SuperAdmin */}
          {isEditingSuperAdmin && (
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-purple-700">Este usuario es SuperAdmin</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {isEditingFundador 
                      ? 'Este es un fundador protegido. Solo puede editarse a sí mismo.'
                      : 'Los SuperAdmins no pueden ser editados por otros SuperAdmins.'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Datos básicos */}
          <Card className="p-5">
            <h2 className="font-semibold mb-4 text-gray-800">Información del Usuario</h2>
            
            <div className="space-y-4">
              <div>
                <Label>Nombre Completo</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({...form, nombre: e.target.value})}
                  className="mt-1"
                  disabled={!canEdit}
                />
              </div>
              
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  className="mt-1 bg-gray-100"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
              </div>

              {/* Selector de Rol */}
              <div>
                <Label>Rol</Label>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => handleRolChange('colaborador')}
                    disabled={!canEdit || isEditingSuperAdmin}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      form.rol === 'colaborador'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${(!canEdit || isEditingSuperAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <p className="font-medium text-sm">Colaborador</p>
                    <p className="text-xs text-gray-500">Acceso limitado</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRolChange('superadmin')}
                    disabled={!canPromoteToSuperAdmin}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      form.rol === 'superadmin'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!canPromoteToSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <p className="font-medium text-sm">SuperAdmin</p>
                    <p className="text-xs text-gray-500">Acceso total</p>
                  </button>
                </div>
                {superadminCount >= 4 && !isEditingSuperAdmin && (
                  <p className="text-xs text-orange-600 mt-2">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Límite de 4 SuperAdmins alcanzado
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Permisos (solo para colaboradores) */}
          {form.rol === 'colaborador' && (
            <Card className="p-5">
              <h2 className="font-semibold mb-4 text-gray-800">Permisos de Acceso</h2>
              <p className="text-sm text-gray-500 mb-4">Selecciona qué secciones puede ver</p>
              
              <div className="space-y-3">
                {PERMISOS_DISPONIBLES.map((permiso) => (
                  <div
                    key={permiso.key}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all border-2 ${
                      canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                    } ${
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

          {form.rol === 'superadmin' && (
            <Card className="p-4 bg-purple-50 border-purple-200">
              <p className="text-sm text-purple-700">
                <Shield className="w-4 h-4 inline mr-2" />
                Los SuperAdmins tienen acceso completo a todas las secciones, incluyendo Seguridad y Finanzas.
              </p>
            </Card>
          )}
        </form>
      </div>

      {/* Botón fijo en la parte inferior */}
      {canEdit && (
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
              className="flex-1 bg-primary"
              disabled={saving}
              onClick={handleSubmit}
            >
              {saving ? (
                'Guardando...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
