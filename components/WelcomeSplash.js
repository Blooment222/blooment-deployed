'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flower } from 'lucide-react'

/**
 * Componente de Splash de Bienvenida post-login
 * Muestra un mensaje personalizado con animación
 */
export function WelcomeSplash({ userName, onComplete }) {
  const [petals, setPetals] = useState([])

  useEffect(() => {
    // Generar pétalos aleatorios
    const petalCount = 15
    const generatedPetals = Array.from({ length: petalCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 15 + Math.random() * 20
    }))
    setPetals(generatedPetals)

    // Auto-completar después de 2.5 segundos
    const timer = setTimeout(() => {
      if (onComplete) onComplete()
    }, 2500)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)'
        }}
      >
        {/* Pétalos cayendo */}
        {petals.map((petal) => (
          <motion.div
            key={petal.id}
            initial={{ 
              top: '-10%',
              left: `${petal.left}%`,
              opacity: 0,
              rotate: 0
            }}
            animate={{ 
              top: '110%',
              opacity: [0, 1, 1, 0],
              rotate: 360
            }}
            transition={{
              duration: petal.duration,
              delay: petal.delay,
              ease: 'easeInOut'
            }}
            className="absolute pointer-events-none"
            style={{
              width: `${petal.size}px`,
              height: `${petal.size}px`
            }}
          >
            <Flower 
              className="text-[#F5B6C6]" 
              style={{
                filter: 'drop-shadow(0 2px 8px rgba(245, 182, 198, 0.4))'
              }}
            />
          </motion.div>
        ))}

        {/* Contenido central */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5,
            delay: 0.2,
            type: 'spring',
            stiffness: 200
          }}
          className="text-center px-8 z-10"
        >
          {/* Logo/Ícono central */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.3,
              type: 'spring',
              stiffness: 150
            }}
            className="mb-6 flex justify-center"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F5B6C6] to-[#FFD1DC] flex items-center justify-center shadow-2xl">
              <Flower className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          {/* Mensaje de bienvenida */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-4xl md:text-5xl font-bold mb-3"
            style={{
              color: '#F5B6C6',
              textShadow: '0 4px 20px rgba(245, 182, 198, 0.6)'
            }}
          >
            ¡Bienvenido de nuevo,
          </motion.h1>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{
              color: '#F5B6C6',
              textShadow: '0 4px 20px rgba(245, 182, 198, 0.6)'
            }}
          >
            {userName}! 🌸
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="text-white/80 text-lg"
          >
            Preparando tus flores favoritas...
          </motion.p>

          {/* Barra de progreso sutil */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.5, ease: 'linear' }}
            className="mt-8 h-1 bg-gradient-to-r from-[#F5B6C6] to-[#FFD1DC] rounded-full max-w-xs mx-auto"
            style={{
              boxShadow: '0 0 20px rgba(245, 182, 198, 0.6)'
            }}
          />
        </motion.div>

        {/* Efecto de brillo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0, 0.3, 0],
            scale: [0.5, 1.5, 2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut'
          }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(245, 182, 198, 0.2) 0%, transparent 70%)'
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}
