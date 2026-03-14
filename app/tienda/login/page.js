'use client'

import React, { useState, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { TiendaLayoutWrapper } from '@/components/TiendaLayoutWrapper'
import { WelcomeSplash } from '@/components/WelcomeSplash'
import { useClienteAuth } from '@/lib/cliente-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useClienteAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const [userName, setUserName] = useState('')

  const redirect = searchParams.get('redirect') || '/tienda'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)

    if (result.success) {
      console.log('✅ Login exitoso, mostrando splash...')
      
      // Mostrar splash de bienvenida
      setUserName(result.user?.nombre || 'Usuario')
      setShowSplash(true)
      setLoading(false)
      
      // El splash se encargará de navegar después de 2.5s
    } else {
      setError(result.error || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  const handleSplashComplete = () => {
    setShowSplash(false)
    
    // Navegar después del splash
    if (redirect === 'checkout') {
      router.push('/tienda/checkout')
    } else if (redirect && redirect !== '/tienda') {
      router.push(redirect)
    } else {
      router.push('/tienda')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
      {/* Isotipo Grande Centrado */}
      <div className="flex flex-col items-center mb-8 mt-4">
        <div className="relative w-24 h-24 mb-4">
          <Image
            src="/blooment-logo-final.png?v=3"
            alt="Blooment"
            fill
            className="object-contain"
            priority
            quality={100}
          />
        </div>
        <h2 className="text-xl font-bold text-[#F5B6C6] text-center mb-1">Blooment</h2>
        <p className="text-sm text-gray-600 text-center">Flores con amor</p>
      </div>

      <Card className="w-full max-w-md border-[#F5B6C6] border-opacity-20">
        <CardHeader className="space-y-1 bg-pink-50 bg-opacity-30">
          <CardTitle className="text-2xl font-bold text-center text-[#F5B6C6]">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center">
            Ingresa tu email y contraseña para acceder
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 text-center font-medium">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Ingresando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
            
            {/* Divider */}
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">o continúa con</span>
              </div>
            </div>
            
            {/* Botón Google OAuth */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-gray-300 hover:border-[#F5B6C6] hover:bg-[#F5B6C6]/5 transition-all duration-200"
              onClick={() => {
                // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
                const redirectUrl = window.location.origin + '/tienda/auth/callback';
                window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
              }}
              disabled={loading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </Button>
            
            <p className="text-sm text-center text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link 
                href={`/tienda/register${redirect !== '/tienda' ? `?redirect=${redirect}` : ''}`}
                className="text-[#F5B6C6] hover:underline font-bold text-base hover:text-[#F5B6C6] transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      
      {/* Splash de bienvenida */}
      {showSplash && (
        <WelcomeSplash 
          userName={userName} 
          onComplete={handleSplashComplete} 
        />
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <TiendaLayoutWrapper>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-[#F5B6C6]" /></div>}>
        <LoginContent />
      </Suspense>
    </TiendaLayoutWrapper>
  )
}
