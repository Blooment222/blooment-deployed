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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Shield, Key, UserPlus, Trash2, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/lib/auth-client'

export default function SecurityPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const { toast } = useToast()
  const { user, getToken } = useAuth()

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

  const handleDeactivateAdmin = async (id, email) => {
    if (!confirm(`¿Estás seguro de desactivar a ${email}?`)) return

    try {
      const token = getToken()
      const res = await fetch(`/api/security/admins/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        toast({ title: '✅ Administrador desactivado', description: `${email} ya no puede acceder al panel` })
        fetchAdmins()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al desactivar', variant: 'destructive' })
    }
  }

  const parsePermisos = (permisosString) => {
    try {
      return JSON.parse(permisosString || '{}')
    } catch {
      return {}
    }
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

        {/* Agregar Colaborador - Link a página completa */}
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

      {/* Lista de Administradores */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios con Acceso</CardTitle>
          <CardDescription>Lista de administradores y colaboradores</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="hidden md:table-cell">Permisos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => {
                const permisos = parsePermisos(admin.permisos)
                return (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      <div>
                        {admin.nombre}
                        <p className="text-xs text-gray-500 sm:hidden">{admin.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{admin.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        admin.rol === 'superadmin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {admin.rol === 'superadmin' ? 'Super Admin' : 'Colaborador'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {admin.rol === 'superadmin' ? (
                        <span className="text-xs text-gray-500">Acceso total</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(permisos).filter(([_, v]) => v).slice(0, 3).map(([key]) => (
                            <span key={key} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                              {key}
                            </span>
                          ))}
                          {Object.entries(permisos).filter(([_, v]) => v).length > 3 && (
                            <span className="text-xs text-gray-400">+más</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        admin.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {admin.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {admin.activo && admin.rol !== 'superadmin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivateAdmin(admin.id, admin.email)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
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
    </div>
  )
}
