// Hook personalizado para confirmación visual con destellos elegantes
import { useCallback } from 'react'

export function useCartAnimation() {
  const animateButton = useCallback((buttonElement) => {
    if (!buttonElement) {
      console.warn('Button element not found for animation')
      return
    }
    
    // Obtener dimensiones y posición del botón
    const buttonRect = buttonElement.getBoundingClientRect()
    const buttonWidth = buttonRect.width
    const buttonHeight = buttonRect.height
    const buttonLeft = buttonRect.left
    const buttonTop = buttonRect.top
    
    // ========================================
    // SVG DE DESTELLO (Estrella de 4 puntas - Diamante)
    // ========================================
    const createSparkle = (x, y, color, delay) => {
      // Crear contenedor div en lugar de SVG directamente
      const sparkleContainer = document.createElement('div')
      sparkleContainer.className = 'sparkle-element'
      sparkleContainer.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 0 L10 6 L16 8 L10 10 L8 16 L6 10 L0 8 L6 6 Z" fill="${color}" />
        </svg>
      `
      
      sparkleContainer.style.cssText = `
        position: fixed;
        left: ${x - 8}px;
        top: ${y - 8}px;
        z-index: 9999;
        pointer-events: none;
        transform: scale(0) rotate(0deg);
        opacity: 0;
        will-change: transform, opacity;
      `
      
      return { element: sparkleContainer, delay }
    }
    
    // ========================================
    // POSICIONES DE DESTELLOS (Alrededor del botón)
    // ========================================
    const sparkles = []
    
    // Colores alternados: Rosa Blooment y Blanco Puro
    const colors = ['#F5B6C6', '#FFFFFF', '#F5B6C6', '#FFFFFF', '#F5B6C6', '#FFFFFF']
    
    // 6 destellos en posiciones estratégicas
    const positions = [
      { x: buttonLeft - 10, y: buttonTop - 10 },                    // Top-left
      { x: buttonLeft + buttonWidth + 10, y: buttonTop - 10 },      // Top-right
      { x: buttonLeft + buttonWidth / 2, y: buttonTop - 15 },       // Top-center
      { x: buttonLeft - 10, y: buttonTop + buttonHeight + 10 },     // Bottom-left
      { x: buttonLeft + buttonWidth + 10, y: buttonTop + buttonHeight + 10 }, // Bottom-right
      { x: buttonLeft + buttonWidth / 2, y: buttonTop + buttonHeight + 15 },  // Bottom-center
    ]
    
    positions.forEach((pos, i) => {
      const sparkle = createSparkle(pos.x, pos.y, colors[i], i * 50) // Stagger de 50ms
      document.body.appendChild(sparkle.element)
      sparkles.push(sparkle)
    })
    
    // ========================================
    // ANIMACIÓN DE DESTELLOS (450ms con stagger)
    // ========================================
    const duration = 450
    const startTime = performance.now()
    
    function animateSparkles(currentTime) {
      const elapsed = currentTime - startTime
      
      sparkles.forEach(({ element, delay }) => {
        const sparkleElapsed = elapsed - delay
        
        if (sparkleElapsed < 0) return // Aún no empieza este destello
        
        const progress = Math.min(sparkleElapsed / duration, 1)
        
        // Curva de animación: pop rápido, hold, desvanecimiento
        let scale, opacity, rotation
        
        if (progress < 0.3) {
          // Pop rápido (0-30%): 0 → 1.2
          const popProgress = progress / 0.3
          scale = popProgress * 1.2
          opacity = popProgress
          rotation = popProgress * 45
        } else if (progress < 0.7) {
          // Hold (30-70%): mantener en 1.2
          scale = 1.2
          opacity = 1
          rotation = 45 + (progress - 0.3) * 90
        } else {
          // Fade out (70-100%): 1.2 → 0
          const fadeProgress = (progress - 0.7) / 0.3
          scale = 1.2 * (1 - fadeProgress)
          opacity = 1 - fadeProgress
          rotation = 90
        }
        
        element.style.transform = `scale(${scale}) rotate(${rotation}deg)`
        element.style.opacity = opacity
      })
      
      // Continuar hasta que el último destello termine
      const lastSparkleEnd = sparkles[sparkles.length - 1].delay + duration
      if (elapsed < lastSparkleEnd) {
        requestAnimationFrame(animateSparkles)
      } else {
        // Limpiar todos los destellos
        sparkles.forEach(({ element }) => element.remove())
      }
    }
    
    requestAnimationFrame(animateSparkles)
    
    // ========================================
    // PULSE DEL BOTÓN (0.2s)
    // ========================================
    buttonElement.classList.add('button-pulse')
    setTimeout(() => {
      buttonElement.classList.remove('button-pulse')
    }, 200)
    
  }, [])
  
  return { animateButton }
}
