'use client'

import React, { useState, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { TiendaLayoutWrapper } from '@/components/TiendaLayoutWrapper'
import { useClienteAuth } from '@/lib/cliente-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register } = useClienteAuth()
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    direccion: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirect = searchParams.get('redirect') || '/tienda'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    const result = await register(
      formData.nombre,
      formData.email,
      formData.password,
      formData.telefono || null,
      formData.direccion || null
    )

    if (result.success) {
      if (redirect === 'checkout') {
        router.push('/tienda/checkout')
      } else {
        router.push(redirect)
      }
    } else {
      setError(result.error || 'Error al registrarse')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8 px-4">
      {/* Isotipo Grande Centrado */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-20 h-20 mb-3">
          <Image
            src="/blooment-logo-final.png?v=3"
            alt="Blooment"
            fill
            className="object-contain"
            priority
            quality={100}
          />
        </div>
        <h2 className="text-lg font-bold text-[#F5B6C6] text-center mb-1">Blooment</h2>
        <p className="text-xs text-gray-600 text-center">Únete a nuestra comunidad</p>
      </div>

      <Card className="w-full max-w-md border-[#F5B6C6] border-opacity-20">
        <CardHeader className="space-y-1 bg-pink-50 bg-opacity-30">
          <CardTitle className="text-2xl font-bold text-center text-[#F5B6C6]">Crear Cuenta</CardTitle>
          <CardDescription className="text-center">
            Completa tus datos para registrarte
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input
                id="nombre"
                name="nombre"
                type="text"
                placeholder="Juan Pérez"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                placeholder="+1234567890"
                value={formData.telefono}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección de Envío</Label>
              <Input
                id="direccion"
                name="direccion"
                type="text"
                placeholder="Calle 123, Ciudad"
                value={formData.direccion}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
            
            <p className="text-sm text-center text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link 
                href={`/tienda/login${redirect !== '/tienda' ? `?redirect=${redirect}` : ''}`}
                className="text-[#F5B6C6] hover:underline font-bold text-base hover:text-[#F5B6C6] transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <TiendaLayoutWrapper>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-[#F5B6C6]" /></div>}>
        <RegisterContent />
      </Suspense>
    </TiendaLayoutWrapper>
  )
}
