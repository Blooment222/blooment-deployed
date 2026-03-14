'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'

// Hook personalizado para cargar Google Maps de forma segura
function useLoadGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      // Si ya está cargado
      if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true)
        return
      }

      // Si el script ya está en proceso de carga
      if (typeof document !== 'undefined' && document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            setIsLoaded(true)
            clearInterval(checkInterval)
          }
        }, 100)
        
        setTimeout(() => clearInterval(checkInterval), 10000) // Timeout después de 10 segundos
        return () => clearInterval(checkInterval)
      }

      // Cargar el script
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      if (!apiKey) {
        console.error('❌ No se encontró NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en las variables de entorno')
        setError('API Key no configurada')
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es`
      script.async = true
      script.defer = true
      
      script.onload = () => {
        setIsLoaded(true)
        console.log('✅ Google Maps API cargada exitosamente')
      }
      
      script.onerror = (e) => {
        console.error('❌ Error cargando Google Maps API:', e)
        console.error('   Verifica que la API Key sea válida y tenga los servicios habilitados:')
        console.error('   - Places API')
        console.error('   - Geocoding API')
        console.error('   - Distance Matrix API')
        setError('Error cargando Maps. Verifica la API Key.')
      }
      
      document.head.appendChild(script)
    } catch (err) {
      console.error('❌ Error en useLoadGoogleMaps:', err)
      setError('Error general')
    }
  }, [])

  return { isLoaded, error }
}

export function GooglePlacesAutocomplete({ value, onChange, placeholder, className }) {
  const inputRef = useRef(null)
  const autocompleteRef = useRef(null)
  const { isLoaded, error } = useLoadGoogleMaps()
  const [localError, setLocalError] = useState(null)

  useEffect(() => {
    // Solo intentar inicializar si está cargado y no hay errores previos
    if (!isLoaded || !inputRef.current || autocompleteRef.current || error) return

    try {
      console.log('🔧 Inicializando Google Places Autocomplete...')
      
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'mx' },
        fields: ['formatted_address', 'geometry', 'name', 'address_components'],
        types: ['address']
      })

      autocomplete.addListener('place_changed', () => {
        try {
          const place = autocomplete.getPlace()
          console.log('📍 Lugar seleccionado:', place)
          
          if (place.formatted_address) {
            onChange(place.formatted_address)
          } else if (place.name) {
            onChange(place.name)
          }
        } catch (err) {
          console.error('Error en place_changed:', err)
        }
      })

      autocompleteRef.current = autocomplete
      console.log('✅ Autocomplete inicializado correctamente')
    } catch (err) {
      console.error('❌ Error inicializando autocomplete:', err)
      setLocalError('Error al inicializar')
      // No lanzar el error, solo registrarlo
    }
  }, [isLoaded, onChange, error])

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
        <MapPin className="w-5 h-5 text-[#F5B7C0]" />
      </div>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Escribe tu dirección...'}
        className={`pl-10 pr-4 border-[#F5B7C0] border-opacity-30 focus:border-[#F5B7C0] focus:ring-[#F5B7C0] ${className}`}
      />
      {!isLoaded && !error && !localError && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-[#F5B7C0] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {(error || localError) && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <span className="text-xs text-gray-400">Sin Maps</span>
        </div>
      )}
      {isLoaded && !error && !localError && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <span className="text-xs text-green-600 font-medium">✓</span>
        </div>
      )}
    </div>
  )
}
