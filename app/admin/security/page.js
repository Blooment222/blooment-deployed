'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Shield, Key, UserPlus, Trash2, Eye, EyeOff, Pencil, AlertTriangle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/lib/auth-client'

// Emails de fundadores protegidos
const EMAILS_FUNDADORES = ['diegoah1107@gmail.com', 'maireyesguevara@gmail.com']

export default function SecurityPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const { toast } = useToast()
  const { user, getToken } = useAuth()

  // Verificaciones de permisos
  const isFundador = user && EMAILS_FUNDADORES.includes(user.email?.toLowerCase())
  const isSuperAdmin = user?.rol === 'superadmin'
  const superadminCount = admins.filter(a => a.rol === 'superadmin' && a.activo).length

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/security/admins', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setAdmins(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Error', description: 'Las contraseñas no coinciden', variant: 'destructive' })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' })
      return
    }

    try {
      const token = getToken()
      const res = await fetch('/api/security/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      if (res.ok) {
        toast({
          title: '✅ Contraseña actualizada',
          description: 'Tu contraseña ha sido actualizada correctamente.'
        })
        setChangePasswordOpen(false)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Error al cambiar contraseña', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    }
  }

  const confirmDelete = (admin) => {
    setAdminToDelete(admin)
    setDeleteDialogOpen(true)
  }

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return

    try {
      const token = getToken()
      const res = await fetch(`/api/security/admins/${adminToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        toast({ 
          title: '✅ Usuario eliminado', 
          description: `${adminToDelete.nombre} ya no tiene acceso al panel` 
        })
        fetchAdmins()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Error al eliminar', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al eliminar', variant: 'destructive' })
    } finally {
      setDeleteDialogOpen(false)
      setAdminToDelete(null)
    }
  }

  const parsePermisos = (permisosString) => {
    try {
      return JSON.parse(permisosString || '{}')
    } catch {
      return {}
    }
  }

  // Función para verificar si se puede editar un usuario
  const canEdit = (admin) => {
    if (!isSuperAdmin) return false
    
    // SuperAdmins no pueden editar otros SuperAdmins
    if (admin.rol === 'superadmin' && admin.email?.toLowerCase() !== user?.email?.toLowerCase()) {
      return false
    }
    
    return true
  }

  // Función para verificar si se puede eliminar un usuario
  const canDelete = (admin) => {
    if (!isSuperAdmin) return false
    
    const isTargetFundador = EMAILS_FUNDADORES.includes(admin.email?.toLowerCase())
    const isTargetSuperAdmin = admin.rol === 'superadmin'
    const isSelf = admin.email?.toLowerCase() === user?.email?.toLowerCase()
    
    // Fundadores solo pueden eliminarse a sí mismos
    if (isTargetFundador) {
      return isSelf && isFundador
    }
    
    // SuperAdmins no pueden eliminar otros SuperAdmins
    if (isTargetSuperAdmin && !isSelf) {
      return false
    }
    
    // Colaboradores pueden ser eliminados por SuperAdmins
    return true
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Toaster />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Seguridad
          </h1>
          <p className="text-sm text-muted-foreground">Gestiona accesos y contraseñas</p>
        </div>
      </div>

      {/* Info de SuperAdmins */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-700">SuperAdmins activos:</span>
              <span className="text-purple-600">{superadminCount}/4</span>
            </div>
            {superadminCount >= 4 && (
              <span className="text-xs text-orange-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Límite alcanzado
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cambiar Contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Mi Contraseña
            </CardTitle>
            <CardDescription>Cambia tu contraseña de acceso</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setChangePasswordOpen(true)} className="w-full">
              Cambiar Contraseña
            </Button>
          </CardContent>
        </Card>

        {/* Agregar Colaborador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Colaboradores
            </CardTitle>
            <CardDescription>Agrega personas con acceso limitado</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/admin/security/nuevo-colaborador')} 
              className="w-full"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Agregar Colaborador
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios con Acceso</CardTitle>
          <CardDescription>Administradores y colaboradores del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {admins.map((admin) => {
              const permisos = parsePermisos(admin.permisos)
              const isTargetFundador = EMAILS_FUNDADORES.includes(admin.email?.toLowerCase())
              const isSelf = admin.email?.toLowerCase() === user?.email?.toLowerCase()
              
              return (
                <div 
                  key={admin.id} 
                  className={`p-4 rounded-lg border-2 ${
                    admin.rol === 'superadmin' 
                      ? 'border-purple-200 bg-purple-50/50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{admin.nombre}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          admin.rol === 'superadmin' 
                            ? 'bg-purple-200 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {admin.rol === 'superadmin' ? 'SuperAdmin' : 'Colaborador'}
                        </span>
                        {isTargetFundador && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            Fundador
                          </span>
                        )}
                        {isSelf && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Tú
                          </span>
                        )}
                        {!admin.activo && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 truncate">{admin.email}</p>
                      
                      {admin.rol === 'colaborador' && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(permisos).filter(([_, v]) => v).map(([key]) => (
                            <span key={key} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                              {key}
                            </span>
                          ))}
                        </div>
                      )}
                      {admin.rol === 'superadmin' && (
                        <p className="text-xs text-purple-600 mt-2">Acceso completo a todas las secciones</p>
                      )}
                    </div>
                    
                    {/* Botones de acción */}
                    {admin.activo && (
                      <div className="flex gap-2 flex-shrink-0">
                        {canEdit(admin) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/security/editar/${admin.id}`)}
                            className="h-9 w-9 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete(admin) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmDelete(admin)}
                            className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Cambiar Contraseña */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>Ingresa tu contraseña actual y la nueva</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label>Contraseña Actual</Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Confirmar Nueva Contraseña</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChangePasswordOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Cambiar Contraseña</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Confirmar Eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              ¿Eliminar usuario?
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar a <strong>{adminToDelete?.nombre}</strong>?
              <br />
              <span className="text-red-600">Perderá el acceso de inmediato y no podrá recuperarlo.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAdmin}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
