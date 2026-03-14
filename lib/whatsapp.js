// Utilidades para envío de mensajes de WhatsApp con Twilio
import twilio from 'twilio'

/**
 * Envía un mensaje de WhatsApp usando Twilio
 * @param {string} to - Número de teléfono del destinatario (formato: +521234567890)
 * @param {string} message - Mensaje a enviar
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function enviarWhatsApp(to, message) {
  try {
    // Verificar que las credenciales existan
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error('❌ Credenciales de Twilio no configuradas')
      return { success: false, error: 'Credenciales de Twilio no configuradas' }
    }

    if (!process.env.TWILIO_WHATSAPP_FROM) {
      console.error('❌ Número de WhatsApp de Twilio no configurado')
      return { success: false, error: 'Número de WhatsApp no configurado' }
    }

    // Inicializar cliente de Twilio
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    // Formatear número de destino para WhatsApp
    const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM.startsWith('whatsapp:') 
      ? process.env.TWILIO_WHATSAPP_FROM 
      : `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`

    console.log(`📱 Enviando WhatsApp de ${fromWhatsApp} a ${toWhatsApp}`)

    // Enviar mensaje
    const result = await client.messages.create({
      from: fromWhatsApp,
      to: toWhatsApp,
      body: message
    })

    console.log(`✅ WhatsApp enviado exitosamente. SID: ${result.sid}, Estado: ${result.status}`)

    return {
      success: true,
      messageId: result.sid,
      status: result.status
    }

  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', {
      mensaje: error.message,
      codigo: error.code,
      detalles: error.moreInfo
    })

    return {
      success: false,
      error: error.message,
      code: error.code
    }
  }
}

/**
 * Envía notificación de nuevo pedido al admin por WhatsApp
 * @param {Object} pedido - Objeto del pedido
 * @returns {Promise<{success: boolean}>}
 */
export async function notificarNuevoPedidoWhatsApp(pedido) {
  try {
    const numeroAdmin = process.env.ADMIN_WHATSAPP || process.env.ADMIN_PHONE

    if (!numeroAdmin) {
      console.log('ℹ️ Número de WhatsApp del admin no configurado')
      return { success: false, error: 'Número del admin no configurado' }
    }

    const mensaje = `
🌸 *NUEVO PEDIDO - BLOOMENT* 🌸

📋 *Pedido:* #${pedido.id.slice(0, 8).toUpperCase()}
💰 *Total:* $ ${pedido.total.toFixed(2)} MXN
📅 *Fecha:* ${new Date(pedido.fecha).toLocaleDateString('es-MX')}

👤 *Cliente:*
${pedido.nombre_cliente}
📧 ${pedido.email_cliente}
📱 ${pedido.telefono_cliente || 'No proporcionado'}

📍 *Entrega:*
${pedido.direccion_envio}

🎁 *Destinatario:*
${pedido.nombre_destinatario || 'No especificado'}
${pedido.tel_destinatario ? `📞 ${pedido.tel_destinatario}` : ''}

⏰ *Horario:* ${pedido.horario_entrega || 'No especificado'}

${pedido.dedicatoria ? `💌 *Dedicatoria:*\n"${pedido.dedicatoria}"` : ''}

🔗 Ver detalles en el panel de admin
`.trim()

    return await enviarWhatsApp(numeroAdmin, mensaje)

  } catch (error) {
    console.error('❌ Error notificando pedido por WhatsApp:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Envía confirmación de pedido al cliente por WhatsApp
 * @param {Object} pedido - Objeto del pedido
 * @returns {Promise<{success: boolean}>}
 */
export async function confirmarPedidoWhatsApp(pedido) {
  try {
    const numeroCliente = pedido.telefono_cliente

    if (!numeroCliente) {
      console.log('ℹ️ Cliente no tiene número de teléfono')
      return { success: false, error: 'Cliente sin número de teléfono' }
    }

    const mensaje = `
¡Hola ${pedido.nombre_cliente}! 🌸

Tu pedido en *Blooment* ha sido recibido exitosamente.

📋 *Número de pedido:* #${pedido.id.slice(0, 8).toUpperCase()}
💰 *Total:* $ ${pedido.total.toFixed(2)} MXN

📍 *Se entregará en:*
${pedido.direccion_envio}

🎁 *Para:* ${pedido.nombre_destinatario || 'Destinatario'}
⏰ *Horario:* ${pedido.horario_entrega || 'Por confirmar'}

Te mantendremos informado sobre el estado de tu pedido.

¡Gracias por tu preferencia! 💐
`.trim()

    return await enviarWhatsApp(numeroCliente, mensaje)

  } catch (error) {
    console.error('❌ Error confirmando pedido por WhatsApp:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Envía actualización de estado del pedido al cliente
 * @param {Object} pedido - Objeto del pedido
 * @param {string} nuevoEstado - Nuevo estado del pedido
 * @returns {Promise<{success: boolean}>}
 */
export async function actualizarEstadoPedidoWhatsApp(pedido, nuevoEstado) {
  try {
    const numeroCliente = pedido.telefono_cliente

    if (!numeroCliente) {
      console.log('ℹ️ Cliente no tiene número de teléfono')
      return { success: false, error: 'Cliente sin número de teléfono' }
    }

    // Mensajes personalizados por estado
    const mensajes = {
      pendiente: `
¡Hola ${pedido.nombre_cliente}! 🌸

Tu pedido #${pedido.id.slice(0, 8).toUpperCase()} está *pendiente de confirmación*.

En breve comenzaremos a preparar tu arreglo floral.

💐 Blooment
      `.trim(),

      en_preparacion: `
¡Hola ${pedido.nombre_cliente}! 👩‍🌾

Tu pedido #${pedido.id.slice(0, 8).toUpperCase()} está *en preparación*.

Nuestro equipo está creando tu hermoso arreglo floral con mucho cuidado.

🎨 Blooment
      `.trim(),

      enviado: `
¡Hola ${pedido.nombre_cliente}! 🚚

Tu pedido #${pedido.id.slice(0, 8).toUpperCase()} está *en camino*.

📍 Se entregará en: ${pedido.direccion_envio}
⏰ Horario estimado: ${pedido.horario_entrega || 'Hoy'}

¡Pronto llegará la alegría! 💐

Blooment
      `.trim(),

      entregado: `
¡Hola ${pedido.nombre_cliente}! ✅

Tu pedido #${pedido.id.slice(0, 8).toUpperCase()} ha sido *entregado exitosamente*.

Esperamos que ${pedido.nombre_destinatario || 'el destinatario'} haya disfrutado nuestras flores 🌸

¡Gracias por confiar en Blooment! 💕

¿Te gustaría dejarnos tu opinión? Nos encantaría saber de ti.
      `.trim(),

      cancelado: `
Hola ${pedido.nombre_cliente},

Tu pedido #${pedido.id.slice(0, 8).toUpperCase()} ha sido *cancelado*.

Si tienes dudas, contáctanos. Estamos aquí para ayudarte.

Blooment 🌸
      `.trim()
    }

    const mensaje = mensajes[nuevoEstado] || `
Hola ${pedido.nombre_cliente},

Tu pedido #${pedido.id.slice(0, 8).toUpperCase()} ha sido actualizado.

Estado: ${nuevoEstado}

Blooment 🌸
    `.trim()

    return await enviarWhatsApp(numeroCliente, mensaje)

  } catch (error) {
    console.error('❌ Error actualizando estado por WhatsApp:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Envía recordatorio de fecha especial al cliente
 * @param {Object} contacto - Contacto favorito con fecha especial
 * @param {Object} cliente - Cliente dueño del contacto
 * @param {number} diasRestantes - Días hasta la fecha especial
 * @returns {Promise<{success: boolean}>}
 */
export async function enviarRecordatorioWhatsApp(contacto, cliente, diasRestantes) {
  try {
    const numeroCliente = cliente.telefono

    if (!numeroCliente) {
      console.log('ℹ️ Cliente no tiene número de teléfono')
      return { success: false, error: 'Cliente sin número de teléfono' }
    }

    const fechaFormateada = new Date(contacto.fecha_especial).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long'
    })

    const mensaje = `
¡Hola ${cliente.nombre}! 🎉

Te recordamos que el *${contacto.motivo}* de *${contacto.nombre}* se acerca:

📅 *Fecha:* ${fechaFormateada} (en ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'})

🌸 ¿Ya pensaste en qué flores enviar?

Visita nuestra tienda para encontrar el arreglo perfecto:
${process.env.NEXT_PUBLIC_BASE_URL || 'https://blooment.com'}/tienda

💐 *Blooment* - Flores con amor
    `.trim()

    return await enviarWhatsApp(numeroCliente, mensaje)

  } catch (error) {
    console.error('❌ Error enviando recordatorio por WhatsApp:', error)
    return { success: false, error: error.message }
  }
}
