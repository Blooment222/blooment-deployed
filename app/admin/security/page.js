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
import { Shield, Key, UserPlus, Trash2, Eye, EyeOff, Mail, Check, X } from 'lucide-react'
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

export default function SecurityPage() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [newAdminForm, setNewAdminForm] = useState({
    nombre: '',
    email: '',
    password: '',
    permisos: {
      dashboard: true,
      productos: true,
      pedidos: true,
      clientes: false,
      cupones: false,
      finanzas: false
    }
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

  const handleAddAdmin = async (e) => {
    e.preventDefault()
    
    if (!newAdminForm.nombre || !newAdminForm.email || !newAdminForm.password) {
      toast({ title: 'Error', description: 'Todos los campos son obligatorios', variant: 'destructive' })
      return
    }

    if (newAdminForm.password.length < 6) {
      toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' })
      return
    }

    try {
      const token = getToken()
      const res = await fetch('/api/security/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: newAdminForm.nombre,
          email: newAdminForm.email,
          password: newAdminForm.password,
          rol: 'colaborador',
          permisos: JSON.stringify(newAdminForm.permisos)
        })
      })

      if (res.ok) {
        toast({
          title: '✅ Administrador creado',
          description: `${newAdminForm.nombre} ha sido agregado como colaborador.`
        })
        setDialogOpen(false)
        setNewAdminForm({
          nombre: '',
          email: '',
          password: '',
          permisos: { dashboard: true, productos: true, pedidos: true, clientes: false, cupones: false, finanzas: false }
        })
        fetchAdmins()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Error al crear administrador', variant: 'destructive' })
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

  const togglePermiso = (key) => {
    setNewAdminForm({
      ...newAdminForm,
      permisos: {
        ...newAdminForm.permisos,
        [key]: !newAdminForm.permisos[key]
      }
    })
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
            <Button onClick={() => setDialogOpen(true)} className="w-full">
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => {
                const permisos = parsePermisos(admin.permisos)
                return (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.nombre}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        admin.rol === 'superadmin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {admin.rol === 'superadmin' ? 'Super Admin' : 'Colaborador'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {admin.rol === 'superadmin' ? (
                        <span className="text-xs text-gray-500">Acceso total</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(permisos).filter(([_, v]) => v).map(([key]) => (
                            <span key={key} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                              {key}
                            </span>
                          ))}
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

      {/* Dialog: Agregar Colaborador */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Colaborador</DialogTitle>
            <DialogDescription>Crea una cuenta con permisos limitados</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div>
              <Label>Nombre Completo *</Label>
              <Input
                value={newAdminForm.nombre}
                onChange={(e) => setNewAdminForm({...newAdminForm, nombre: e.target.value})}
                placeholder="Ej: María López"
                required
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={newAdminForm.email}
                onChange={(e) => setNewAdminForm({...newAdminForm, email: e.target.value})}
                placeholder="maria@ejemplo.com"
                required
              />
            </div>
            <div>
              <Label>Contraseña * (mínimo 6 caracteres)</Label>
              <Input
                type="password"
                value={newAdminForm.password}
                onChange={(e) => setNewAdminForm({...newAdminForm, password: e.target.value})}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Esta persona podrá cambiarla después</p>
            </div>

            {/* Selector de Permisos */}
            <div>
              <Label className="mb-2 block">Permisos de Acceso</Label>
              <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
                {PERMISOS_DISPONIBLES.map((permiso) => (
                  <div
                    key={permiso.key}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      newAdminForm.permisos[permiso.key] 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-white border border-gray-200'
                    }`}
                    onClick={() => togglePermiso(permiso.key)}
                  >
                    <div>
                      <p className="font-medium text-sm">{permiso.label}</p>
                      <p className="text-xs text-gray-500">{permiso.description}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      newAdminForm.permisos[permiso.key] ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      {newAdminForm.permisos[permiso.key] ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                El colaborador NO podrá acceder a Seguridad ni editar permisos
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-blue-700">Notificación por Email:</p>
                  <p className="text-xs text-blue-600">
                    Recibirás un email en <strong>blooment222@outlook.com</strong> cuando se cree el nuevo colaborador.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <UserPlus className="w-4 h-4 mr-2" />
                Crear Colaborador
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
