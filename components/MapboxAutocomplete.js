'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

/**
 * Componente de autocompletado de direcciones usando Mapbox Geocoding API REST
 * Configurado para México con idioma español
 * Sin dependencias de @mapbox/search-js-react para evitar problemas de SSR
 */
export function MapboxAutocomplete({
  onAddressSelect,
  placeholder = 'Buscar dirección...',
  className = '',
  isLoading = false,
  value = '',
  onChange
}) {
  const [inputValue, setInputValue] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [error, setError] = useState(null)
  const debounceTimeout = useRef(null)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Función para buscar direcciones en Mapbox
  const searchAddresses = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    if (!accessToken) {
      setError('Token de Mapbox no configurado')
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const encodedQuery = encodeURIComponent(query)
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?country=mx&language=es&limit=8&access_token=${accessToken}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Error al buscar direcciones')
      }

      const data = await response.json()
      
      console.log('🗺️ Mapbox respuesta:', { query, totalResults: data.features?.length || 0 })
      
      if (data.features && data.features.length > 0) {
        setSuggestions(data.features)
        setShowDropdown(true)
      } else {
        setSuggestions([])
        setShowDropdown(false)
      }
    } catch (err) {
      console.error('Error buscando direcciones:', err)
      setError('Error al buscar direcciones. Por favor intenta de nuevo.')
      setSuggestions([])
      setShowDropdown(false)
    } finally {
      setIsSearching(false)
    }
  }, [accessToken])

  // Handler para cambios en el input con debounce
  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    if (onChange) {
      onChange(newValue)
    }

    // Limpiar timeout anterior
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    // Crear nuevo timeout para buscar después de 500ms
    debounceTimeout.current = setTimeout(() => {
      searchAddresses(newValue)
    }, 500)
  }

  // Handler cuando se selecciona una sugerencia
  const handleSelectSuggestion = (feature) => {
    const addressData = {
      fullAddress: feature.place_name,
      latitude: feature.center[1], // Mapbox usa [lng, lat]
      longitude: feature.center[0],
      formattedAddress: feature.place_name,
    }

    setInputValue(feature.place_name)
    setSuggestions([])
    setShowDropdown(false)
    
    if (onChange) {
      onChange(feature.place_name)
    }

    if (onAddressSelect) {
      onAddressSelect(addressData)
    }
  }

  // Fallback si no hay token
  if (!accessToken) {
    return (
      <div className={`w-full ${className}`}>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              if (onChange) onChange(e.target.value)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5B6C6] focus:border-[#F5B6C6]"
            disabled={isLoading}
          />
        </div>
        <p className="text-xs text-red-500 mt-1">Error: Token de Mapbox no configurado</p>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        {/* Input con icono de ubicación */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#F5B6C6]" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowDropdown(true)
              }
            }}
            className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5B6C6] focus:border-[#F5B6C6] transition-all duration-200"
            disabled={isLoading}
            autoComplete="off"
          />
          {/* Indicador de carga */}
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#F5B6C6] animate-spin" />
          )}
        </div>

        {/* Dropdown de sugerencias - MEJORADO PARA MODALES */}
        {showDropdown && suggestions.length > 0 && typeof window !== 'undefined' && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#F5B6C6] rounded-lg shadow-2xl max-h-80 overflow-y-auto"
            style={{
              zIndex: 99999,
              position: 'absolute'
            }}
          >
            {suggestions.map((feature, index) => (
              <button
                key={feature.id || index}
                type="button"
                onClick={() => handleSelectSuggestion(feature)}
                className="w-full px-4 py-3 text-left hover:bg-pink-50 transition-colors duration-150 flex items-start gap-3 border-b border-gray-100 last:border-b-0"
              >
                <MapPin className="w-4 h-4 text-[#F5B6C6] mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {feature.text}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {feature.place_name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Mensaje de ayuda */}
      {inputValue.length > 0 && inputValue.length < 3 && !isSearching && (
        <p className="text-xs text-gray-500 mt-1">
          Escribe al menos 3 caracteres para buscar
        </p>
      )}
    </div>
  )
}

export default MapboxAutocomplete
