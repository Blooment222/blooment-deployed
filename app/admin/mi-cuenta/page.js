'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Key, Eye, EyeOff, User } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/lib/auth-client'

export default function MiCuentaPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const { toast } = useToast()
  const { user, getToken } = useAuth()

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

    setLoading(true)
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
          description: 'Tu contraseña ha sido cambiada correctamente.'
        })
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Error al cambiar contraseña', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <Toaster />
      
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Mi Cuenta
        </h1>
        <p className="text-sm text-muted-foreground">Gestiona tu información de acceso</p>
      </div>

      {/* Info del Usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <Label className="text-muted-foreground">Nombre</Label>
            <p className="font-medium">{user?.nombre}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Rol</Label>
            <p className="font-medium capitalize">{user?.rol === 'superadmin' ? 'Super Administrador' : 'Colaborador'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cambiar Contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
        </CardHeader>
        <CardContent>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
