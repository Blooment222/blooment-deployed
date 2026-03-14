'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function SplashPage() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Marcar como cargado después de 2.5 segundos
    const loadTimer = setTimeout(() => {
      setIsLoaded(true)
      // Iniciar animación de salida
      setIsAnimatingOut(true)
    }, 2500)

    // Desmontar el splash después de que termine la animación (700ms)
    const unmountTimer = setTimeout(() => {
      setShowSplash(false)
      // Redirigir a la tienda
      router.push('/tienda')
    }, 2500 + 700) // 2.5s de espera + 0.7s de animación

    return () => {
      clearTimeout(loadTimer)
      clearTimeout(unmountTimer)
    }
  }, [router])

  // No renderizar nada si ya se desmontó
  if (!showSplash) return null

  return (
    <>
      <style jsx>{`
        @keyframes softFloatUp {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-30px);
            opacity: 0;
          }
        }

        @keyframes blurReveal {
          0% {
            opacity: 1;
            backdrop-filter: blur(0px);
          }
          50% {
            backdrop-filter: blur(10px);
          }
          100% {
            opacity: 0;
            backdrop-filter: blur(10px);
          }
        }

        .soft-float-up {
          animation: softFloatUp 0.7s ease-in-out forwards;
        }

        .blur-reveal {
          animation: blurReveal 0.7s ease-in-out forwards;
        }
      `}</style>

      <div 
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${
          isAnimatingOut ? 'blur-reveal pointer-events-none' : ''
        }`}
        style={{ backgroundColor: '#F5B6C6' }}
      >
        {/* Contenedor del isotipo blanco con animación suave hacia arriba */}
        <div 
          className={`relative w-48 h-48 mb-8 ${
            !isAnimatingOut ? 'animate-pulse' : ''
          } ${
            isAnimatingOut ? 'soft-float-up' : ''
          }`}
        >
          <Image
            src="/blooment-logo-final.png?v=3"
            alt="Blooment Logo"
            fill
            className="object-contain brightness-0 invert"
            priority
            quality={100}
          />
        </div>

        {/* Nombre de la marca - se desvanece con el isotipo */}
        <h1 
          className={`text-5xl font-bold text-white mb-2 ${
            isAnimatingOut ? 'soft-float-up' : ''
          }`}
        >
          Blooment
        </h1>
        
        {/* Eslogan - se desvanece con el isotipo */}
        <p 
          className={`text-lg text-white/80 ${
            isAnimatingOut ? 'soft-float-up' : ''
          }`}
          style={{ animationDelay: '0.05s' }}
        >
          Flores con amor
        </p>
      </div>
    </>
  )
}
