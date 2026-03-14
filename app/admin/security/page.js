'use client'

import { useState, useEffect } from 'react'
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
import { Shield, Key, UserPlus, Trash2, Eye, EyeOff, Mail } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/lib/auth-client'

export default function SecurityPage() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [newAdminForm, setNewAdminForm] = useState({
    nombre: '',
    email: '',
    password: ''
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive'
      })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive'
      })
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

      const data = await res.json()

      if (res.ok) {
        toast({
          title: '✅ Contraseña Cambiada',
          description: 'Tu contraseña ha sido actualizada. Se envió una notificación a tu email.'
        })
        setChangePasswordOpen(false)
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo cambiar la contraseña',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al cambiar la contraseña',
        variant: 'destructive'
      })
    }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()

    if (!newAdminForm.nombre || !newAdminForm.email || !newAdminForm.password) {
      toast({
        title: 'Error',
        description: 'Todos los campos son requeridos',
        variant: 'destructive'
      })
      return
    }

    if (newAdminForm.password.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive'
      })
      return
    }

    try {
      const token = getToken()
      const res = await fetch('/api/security/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAdminForm)
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: '✅ Administrador Creado',
          description: `${newAdminForm.nombre} ha sido agregado. Se envió una notificación a tu email.`
        })
        setDialogOpen(false)
        setNewAdminForm({
          nombre: '',
          email: '',
          password: ''
        })
        fetchAdmins()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo crear el administrador',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al crear el administrador',
        variant: 'destructive'
      })
    }
  }

  const handleDeactivateAdmin = async (id, email) => {
    if (!confirm(`¿Estás seguro de desactivar a ${email}?`)) {
      return
    }

    try {
      const token = getToken()
      const res = await fetch(`/api/security/deactivate-admin/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        toast({
          title: '✅ Administrador Desactivado',
          description: `${email} ya no puede acceder al panel`
        })
        fetchAdmins()
      } else {
        const data = await res.json()
        toast({
          title: 'Error',
          description: data.error || 'No se pudo desactivar',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Ajustes de Seguridad</h1>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster />
      
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-[#F5B6C6]" />
          Ajustes de Seguridad
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestiona las contraseñas y accesos de administradores
        </p>
      </div>

      {/* Cambiar Contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Tu Contraseña
          </CardTitle>
          <CardDescription>
            Cambia tu contraseña actual. Recibirás una notificación por email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setChangePasswordOpen(true)}>
            <Key className="h-4 w-4 mr-2" />
            Cambiar Mi Contraseña
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Administradores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Administradores</CardTitle>
              <CardDescription>
                {admins.length} personas con acceso al panel
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Administrador
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.nombre}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      {admin.activo ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ❌ Inactivo
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(admin.createdAt).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell className="text-right">
                      {admin.activo && admin.email !== user?.email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeactivateAdmin(admin.id, admin.email)}
                          title="Desactivar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      {admin.email === user?.email && (
                        <span className="text-xs text-muted-foreground">Tú</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Cambiar Contraseña */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu contraseña actual y tu nueva contraseña
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Contraseña Actual *</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nueva Contraseña * (mínimo 6 caracteres)</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    required
                  />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex gap-2">
                  <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <strong>Notificación por Email:</strong><br/>
                    Recibirás un email de confirmación en <strong>blooment@gmail.com</strong> cuando cambies tu contraseña.
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChangePasswordOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Cambiar Contraseña
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Nuevo Administrador */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Administrador</DialogTitle>
            <DialogDescription>
              Crea una cuenta de administrador para tu socio o colaborador
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  value={newAdminForm.nombre}
                  onChange={(e) => setNewAdminForm({...newAdminForm, nombre: e.target.value})}
                  placeholder="Ej: María López"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({...newAdminForm, email: e.target.value})}
                  placeholder="maria@ejemplo.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña * (mínimo 6 caracteres)</Label>
                <Input
                  id="password"
                  type="password"
                  value={newAdminForm.password}
                  onChange={(e) => setNewAdminForm({...newAdminForm, password: e.target.value})}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Esta persona podrá cambiarla después desde su panel
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex gap-2">
                  <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <strong>Notificación por Email:</strong><br/>
                    Recibirás un email en <strong>blooment@gmail.com</strong> cuando se cree el nuevo administrador.
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Administrador
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
