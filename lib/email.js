/**
 * Sistema de Notificaciones por Email para Blooment
 * Usando Resend - Compatible con Next.js 14 App Router
 */

import { Resend } from 'resend'

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY)
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev'

/**
 * Plantillas de email para cada estado del pedido
 */
const emailTemplates = {
  pendiente: {
    subject: '✅ Pedido Confirmado - Blooment',
    getHtml: (pedido, cliente) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; border: 2px solid #F5B6C6; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #F5B6C6 0%, #FFD1DC 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🌸 ¡Pedido Confirmado!</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Hola <strong>${cliente.nombre}</strong>,</p>
          <p style="font-size: 16px; color: #333;">¡Gracias por tu compra en Blooment! Tu pedido ha sido recibido y está listo para ser preparado.</p>
          
          <div style="background-color: #FFF5F7; border-left: 4px solid #F5B6C6; padding: 15px; margin: 20px 0;">
            <h3 style="color: #F5B6C6; margin-top: 0;">Detalles del Pedido</h3>
            <p><strong>Número de Pedido:</strong> #${pedido.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>Total:</strong> $ ${pedido.total.toFixed(2)} MXN</p>
            <p><strong>Dirección de Entrega:</strong> ${pedido.direccion_entrega || pedido.direccion_envio}</p>
            ${pedido.horario_entrega ? `<p><strong>Horario:</strong> ${pedido.horario_entrega}</p>` : ''}
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">Recibirás una notificación cuando tu pedido esté en preparación.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #F5B6C6; font-weight: bold;">Con amor, el equipo de Blooment 💐</p>
          </div>
        </div>
      </div>
    `
  },
  
  en_preparacion: {
    subject: '🌷 ¡Buenas noticias! Tu arreglo está en preparación - Blooment',
    getHtml: (pedido, cliente) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; border: 2px solid #F5B6C6; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #F5B6C6 0%, #FFD1DC 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✂️ ¡Estamos diseñando tu arreglo!</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Hola <strong>${cliente.nombre}</strong>,</p>
          <p style="font-size: 18px; color: #F5B6C6; font-weight: bold;">¡Buenas noticias! Estamos diseñando tu arreglo en este momento 🌸</p>
          <p style="font-size: 16px; color: #333;">Nuestros floristas están seleccionando las flores más frescas y creando un arreglo hermoso especialmente para ti.</p>
          
          <div style="background-color: #E3F2FD; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
            <h3 style="color: #2196F3; margin-top: 0;">Estado del Pedido</h3>
            <p><strong>Número de Pedido:</strong> #${pedido.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>Estado:</strong> En Preparación ✂️</p>
            <p><strong>Próximo paso:</strong> Envío a tu dirección</p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">Te notificaremos cuando tu pedido esté en camino.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #F5B6C6; font-weight: bold;">Con amor, el equipo de Blooment 💐</p>
          </div>
        </div>
      </div>
    `
  },
  
  enviado: {
    subject: '🚚 ¡Tus flores ya van en camino! - Blooment',
    getHtml: (pedido, cliente) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; border: 2px solid #F5B6C6; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #9C27B0 0%, #E1BEE7 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🚚 ¡Tu pedido está en camino!</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Hola <strong>${cliente.nombre}</strong>,</p>
          <p style="font-size: 18px; color: #9C27B0; font-weight: bold;">¡Tus flores ya van en camino! 🚚💨</p>
          <p style="font-size: 16px; color: #333;">El repartidor está en ruta para entregar tu pedido. Estate atento a la entrega.</p>
          
          <div style="background-color: #F3E5F5; border-left: 4px solid #9C27B0; padding: 15px; margin: 20px 0;">
            <h3 style="color: #9C27B0; margin-top: 0;">Información de Entrega</h3>
            <p><strong>Número de Pedido:</strong> #${pedido.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>Dirección:</strong> ${pedido.direccion_entrega || pedido.direccion_envio}</p>
            ${pedido.horario_entrega ? `<p><strong>Horario estimado:</strong> ${pedido.horario_entrega}</p>` : ''}
            ${pedido.nombre_destinatario ? `<p><strong>Destinatario:</strong> ${pedido.nombre_destinatario}</p>` : ''}
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">Recibirás una confirmación cuando tu pedido haya sido entregado.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #F5B6C6; font-weight: bold;">Con amor, el equipo de Blooment 💐</p>
          </div>
        </div>
      </div>
    `
  },
  
  entregado: {
    subject: '🎉 ¡Pedido Entregado! Gracias por confiar en Blooment 🌸',
    getHtml: (pedido, cliente) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; border: 2px solid #F5B6C6; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">💐 ¡Pedido Entregado!</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Hola <strong>${cliente.nombre}</strong>,</p>
          <p style="font-size: 18px; color: #4CAF50; font-weight: bold;">¡Tu pedido ha sido entregado con éxito! 🎉</p>
          <p style="font-size: 16px; color: #333;">Esperamos que disfrutes de tus flores y que alegren tu día o el de alguien especial.</p>
          
          <div style="background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; text-align: center;">
            <h3 style="color: #4CAF50; margin-top: 0;">❤️ ¡Gracias por confiar en Blooment!</h3>
            <p style="font-size: 14px; color: #666;">Pedido #${pedido.id.slice(0, 8).toUpperCase()}</p>
          </div>
          
          <p style="font-size: 16px; color: #333; margin-top: 20px;">¿Te gustó nuestro servicio? Nos encantaría saber tu opinión. Tu feedback nos ayuda a mejorar cada día.</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #F5B6C6; font-weight: bold; font-size: 18px;">¡Vuelve pronto! 🌸</p>
            <p style="color: #666; font-size: 14px;">El equipo de Blooment te espera</p>
          </div>
        </div>
      </div>
    `
  }
}

/**
 * Enviar notificación al cliente según el estado del pedido
 */
export async function enviarNotificacionCliente(pedido, cliente, nuevoEstado) {
  try {
    console.log(`📧 Intentando enviar email a cliente: ${cliente.email} para estado: ${nuevoEstado}`)
    
    const template = emailTemplates[nuevoEstado]
    
    if (!template) {
      console.log(`⚠️ No hay template para el estado: ${nuevoEstado}`)
      return { success: false, message: 'Template no encontrado' }
    }
    
    const { data, error } = await resend.emails.send({
      from: `Blooment 🌸 <${SENDER_EMAIL}>`,
      to: [cliente.email],
      subject: template.subject,
      html: template.getHtml(pedido, cliente)
    })
    
    if (error) {
      console.error('❌ Error de Resend:', error)
      return { success: false, error: error.message }
    }
    
    console.log(`✅ Email enviado a ${cliente.email}. ID:`, data.id)
    return { success: true, messageId: data.id }
    
  } catch (error) {
    console.error('❌ Error enviando email al cliente:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Enviar notificación al admin cuando hay un nuevo pedido pagado
 */
export async function enviarNotificacionAdmin(pedido, cliente) {
  try {
    console.log(`📧 Enviando notificación de nuevo pedido al admin`)
    
    const { data, error } = await resend.emails.send({
      from: `Sistema Blooment 🌸 <${SENDER_EMAIL}>`,
      to: [process.env.EMAIL_USER], // Email del admin
      subject: `🔔 NUEVO PEDIDO PAGADO - #${pedido.id.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; border: 3px solid #FF9800; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #FF9800 0%, #FFB74D 100%); padding: 25px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 26px;">🔔 NUEVO PEDIDO PAGADO</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">¡Empieza la producción!</p>
          </div>
          <div style="padding: 30px; background-color: #FFF3E0;">
            <div style="background-color: white; border: 2px solid #FF9800; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #FF9800; margin-top: 0; border-bottom: 2px solid #FFE0B2; padding-bottom: 10px;">Información del Pedido</h2>
              <p><strong style="color: #FF9800;">Número de Pedido:</strong> #${pedido.id.slice(0, 8).toUpperCase()}</p>
              <p><strong style="color: #FF9800;">Total:</strong> $ ${pedido.total.toFixed(2)} MXN</p>
              <p><strong style="color: #FF9800;">Estado:</strong> ${pedido.estado.toUpperCase()}</p>
            </div>
            
            <div style="background-color: white; border: 2px solid #2196F3; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #2196F3; margin-top: 0; border-bottom: 2px solid #BBDEFB; padding-bottom: 10px;">Datos del Cliente</h2>
              <p><strong style="color: #2196F3;">Nombre:</strong> ${cliente.nombre}</p>
              <p><strong style="color: #2196F3;">Email:</strong> ${cliente.email}</p>
              <p><strong style="color: #2196F3;">Teléfono:</strong> ${cliente.telefono || 'No proporcionado'}</p>
            </div>
            
            <div style="background-color: white; border: 2px solid #4CAF50; border-radius: 8px; padding: 20px;">
              <h2 style="color: #4CAF50; margin-top: 0; border-bottom: 2px solid #C8E6C9; padding-bottom: 10px;">Detalles de Entrega</h2>
              <p><strong style="color: #4CAF50;">Dirección:</strong> ${pedido.direccion_entrega || pedido.direccion_envio}</p>
              ${pedido.nombre_destinatario ? `<p><strong style="color: #4CAF50;">Destinatario:</strong> ${pedido.nombre_destinatario}</p>` : ''}
              ${pedido.telefono_destinatario || pedido.tel_destinatario ? `<p><strong style="color: #4CAF50;">Tel. Destinatario:</strong> ${pedido.telefono_destinatario || pedido.tel_destinatario}</p>` : ''}
              ${pedido.horario_entrega ? `<p><strong style="color: #4CAF50;">Horario:</strong> ${pedido.horario_entrega}</p>` : ''}
              ${pedido.dedicatoria ? `<p><strong style="color: #4CAF50;">Dedicatoria:</strong><br/><em style="color: #666;">"${pedido.dedicatoria}"</em></p>` : ''}
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #F5B6C6 0%, #FFD1DC 100%); border-radius: 8px;">
              <p style="color: white; font-weight: bold; font-size: 18px; margin: 0;">🚀 Accede al panel admin para gestionar</p>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/pedidos" style="display: inline-block; margin-top: 15px; padding: 12px 30px; background-color: white; color: #F5B6C6; text-decoration: none; font-weight: bold; border-radius: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                Ver Pedido en Admin
              </a>
            </div>
          </div>
        </div>
      `
    })
    
    if (error) {
      console.error('❌ Error de Resend al enviar a admin:', error)
      return { success: false, error: error.message }
    }
    
    console.log(`✅ Notificación enviada al admin. ID:`, data.id)
    return { success: true, messageId: data.id }
    
  } catch (error) {
    console.error('❌ Error enviando email al admin:', error)
    return { success: false, error: error.message }
  }
}
