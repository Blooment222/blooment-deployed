// Servicio de OneSignal para enviar notificaciones push
// Documentación: https://documentation.onesignal.com/reference/push-channel-properties

class OneSignalService {
  constructor() {
    this.appId = process.env.ONESIGNAL_APP_ID
    this.restApiKey = process.env.ONESIGNAL_REST_API_KEY
    this.apiUrl = 'https://onesignal.com/api/v1'
  }

  /**
   * Verifica si OneSignal está configurado correctamente
   */
  isConfigured() {
    return !!(this.appId && this.restApiKey)
  }

  /**
   * Envía una notificación a un usuario específico usando su push_token
   * @param {string} playerId - OneSignal Player ID (push_token del usuario)
   * @param {object} notification - { title, message, url }
   */
  async sendToUser(playerId, notification) {
    if (!this.isConfigured()) {
      console.warn('⚠️ OneSignal no está configurado. Notificación no enviada.')
      return { success: false, error: 'OneSignal not configured' }
    }

    try {
      const payload = {
        app_id: this.appId,
        include_player_ids: [playerId],
        headings: { en: notification.title },
        contents: { en: notification.message },
        url: notification.url || undefined,
        data: notification.data || {}
      }

      const response = await fetch(`${this.apiUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.restApiKey}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Error enviando notificación a usuario:', data)
        return { success: false, error: data }
      }

      console.log('✅ Notificación enviada a usuario:', playerId)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Error en sendToUser:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Envía una notificación a múltiples usuarios
   * @param {string[]} playerIds - Array de OneSignal Player IDs
   * @param {object} notification - { title, message, url }
   */
  async sendToUsers(playerIds, notification) {
    if (!this.isConfigured()) {
      console.warn('⚠️ OneSignal no está configurado. Notificación no enviada.')
      return { success: false, error: 'OneSignal not configured' }
    }

    if (!playerIds || playerIds.length === 0) {
      console.warn('⚠️ No hay usuarios para enviar notificación')
      return { success: false, error: 'No recipients' }
    }

    try {
      const payload = {
        app_id: this.appId,
        include_player_ids: playerIds,
        headings: { en: notification.title },
        contents: { en: notification.message },
        url: notification.url || undefined,
        data: notification.data || {}
      }

      const response = await fetch(`${this.apiUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.restApiKey}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Error enviando notificación a usuarios:', data)
        return { success: false, error: data }
      }

      console.log(`✅ Notificación enviada a ${playerIds.length} usuarios`)
      return { success: true, data, recipients: playerIds.length }
    } catch (error) {
      console.error('❌ Error en sendToUsers:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Envía una notificación a TODOS los usuarios suscritos
   * @param {object} notification - { title, message, url }
   */
  async sendToAll(notification) {
    if (!this.isConfigured()) {
      console.warn('⚠️ OneSignal no está configurado. Notificación no enviada.')
      return { success: false, error: 'OneSignal not configured' }
    }

    try {
      const payload = {
        app_id: this.appId,
        included_segments: ['All'], // Envía a todos los usuarios suscritos
        headings: { en: notification.title },
        contents: { en: notification.message },
        url: notification.url || undefined,
        data: notification.data || {}
      }

      const response = await fetch(`${this.apiUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.restApiKey}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Error enviando notificación a todos:', data)
        return { success: false, error: data }
      }

      console.log('✅ Notificación enviada a todos los usuarios')
      return { success: true, data }
    } catch (error) {
      console.error('❌ Error en sendToAll:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Notificaciones transaccionales predefinidas para cambios de estado de pedidos
   */
  getOrderStatusNotification(status, pedidoId) {
    const notifications = {
      'en_preparacion': {
        title: '¡Tu pedido está en preparación! 🌸',
        message: 'Estamos armando tu hermoso arreglo floral con el mayor cuidado.',
        url: `/tienda/pedidos/${pedidoId}`
      },
      'enviado': {
        title: '¡Tu pedido va en camino! 🚚',
        message: 'Las flores están frescas y listas para sorprender. ¡Llegarán pronto!',
        url: `/tienda/pedidos/${pedidoId}`
      },
      'entregado': {
        title: '¡Pedido entregado! ✨',
        message: 'Tu pedido ha sido entregado con éxito. ¡Esperamos que lo disfruten!',
        url: `/tienda/pedidos/${pedidoId}`
      },
      'cancelado': {
        title: 'Pedido cancelado ❌',
        message: 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.',
        url: `/tienda/cuenta`
      }
    }

    return notifications[status] || null
  }

  /**
   * Envía notificación automática cuando cambia el estado de un pedido
   */
  async notifyOrderStatusChange(playerId, status, pedidoId) {
    const notification = this.getOrderStatusNotification(status, pedidoId)
    
    if (!notification) {
      console.warn(`⚠️ No hay notificación definida para el estado: ${status}`)
      return { success: false, error: 'Unknown status' }
    }

    return await this.sendToUser(playerId, notification)
  }
}

// Exportar instancia única (singleton)
const oneSignalService = new OneSignalService()
export default oneSignalService
