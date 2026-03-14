import useSWR from 'swr'

// Fetcher function para SWR
const fetcher = (url) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Error al cargar productos')
  return res.json()
})

/**
 * Custom hook para cargar productos con caché automático
 * Usa SWR (Stale-While-Revalidate) para optimizar el rendimiento
 */
export function useProductos() {
  const { data, error, isLoading, mutate } = useSWR('/api/productos', fetcher, {
    // Configuración optimizada para productos
    revalidateOnFocus: false, // No revalidar al hacer focus en la ventana
    revalidateOnReconnect: true, // Revalidar al reconectar
    dedupingInterval: 60000, // Deduplicar requests por 1 minuto
    focusThrottleInterval: 300000, // Throttle de 5 minutos para revalidación
    
    // NO usar fallbackData porque causa hydration errors
    // SWR maneja su propia caché en memoria
    
    // Revalidar cada 5 minutos en background
    refreshInterval: 300000,
    
    // Retry automático en caso de error
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    
    // Callback cuando se obtienen nuevos datos
    onSuccess: (data) => {
      // Solo guardar en localStorage en el cliente
      if (typeof window !== 'undefined') {
        saveCache(data)
      }
    }
  })

  return {
    productos: data || [],
    isLoading,
    isError: error,
    mutate, // Para forzar revalidación manual si es necesario
  }
}

/**
 * Hook para cargar un producto específico por ID
 */
export function useProducto(id) {
  const { data, error, isLoading } = useSWR(
    id ? `/api/productos/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    producto: data,
    isLoading,
    isError: error,
  }
}

// Funciones auxiliares para caché en localStorage (solo cliente)
function saveCache(data) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('productos_swr_cache', JSON.stringify(data))
    localStorage.setItem('productos_swr_cache_time', Date.now().toString())
  } catch (e) {
    console.error('Error guardando caché:', e)
  }
}
