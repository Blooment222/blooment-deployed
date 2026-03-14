/**
 * Sistema de Recordatorios de Fechas Especiales
 * Envia notificaciones por email y WhatsApp
 */

import { Resend } from 'resend'
import { enviarRecordatorioWhatsApp } from './whatsapp'

const resend = new Resend(process.env.RESEND_API_KEY)
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev'
const ADMIN_EMAIL = process.env.EMAIL_USER || 'blooment222@gmail.com'

/**
 * Enviar recordatorio al admin sobre fecha especial próxima
 */
export async function enviarRecordatorioAdmin(contacto, cliente, diasRestantes) {
  try {
    const { data, error } = await resend.emails.send({
      from: `Sistema Blooment 🌸 <${SENDER_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `🔔 Recordatorio: ${contacto.motivo} de ${contacto.nombre} en ${diasRestantes} días`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; border: 3px solid #F5B6C6; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #F5B6C6 0%, #FFD1DC 100%); padding: 25px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 26px;">🔔 Recordatorio de Fecha Especial</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">¡Oportunidad de venta!</p>
          </div>
          
          <div style="padding: 30px; background-color: #FFF3E0;">
            <div style="background-color: white; border: 2px solid #F5B6C6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #F5B6C6; margin-top: 0; border-bottom: 2px solid #FFE0B2; padding-bottom: 10px;">Fecha Especial Próxima</h2>
              <p><strong style="color: #F5B6C6;">Evento:</strong> ${contacto.motivo}</p>
              <p><strong style="color: #F5B6C6;">Destinatario:</strong> ${contacto.nombre}</p>
              <p><strong style="color: #F5B6C6;">Fecha:</strong> ${new Date(contacto.fecha_especial).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p><strong style="color: #F5B6C6;">Días restantes:</strong> ${diasRestantes} días</p>
            </div>
            
            <div style="background-color: white; border: 2px solid #2196F3; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #2196F3; margin-top: 0; border-bottom: 2px solid #BBDEFB; padding-bottom: 10px;">Datos del Cliente</h2>
              <p><strong style="color: #2196F3;">Nombre:</strong> ${cliente.nombre}</p>
              <p><strong style="color: #2196F3;">Email:</strong> ${cliente.email}</p>
              <p><strong style="color: #2196F3;">Teléfono:</strong> ${cliente.telefono || 'No proporcionado'}</p>
            </div>
            
            <div style="background-color: white; border: 2px solid #4CAF50; border-radius: 8px; padding: 20px;">
              <h2 style="color: #4CAF50; margin-top: 0; border-bottom: 2px solid #C8E6C9; padding-bottom: 10px;">Datos de Entrega Guardados</h2>
              <p><strong style="color: #4CAF50;">Teléfono:</strong> ${contacto.telefono}</p>
              <p><strong style="color: #4CAF50;">Dirección:</strong> ${contacto.direccion}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #F5B6C6 0%, #FFD1DC 100%); border-radius: 8px;">
              <p style="color: white; font-weight: bold; font-size: 18px; margin: 0;">💡 Acción Sugerida</p>
              <p style="color: white; margin: 10px 0; font-size: 14px;">
                Contacta al cliente para ofrecerle un arreglo especial para esta fecha
              </p>
            </div>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('❌ Error de Resend al enviar recordatorio a admin:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Recordatorio enviado al admin. ID:`, data.id)
    return { success: true, messageId: data.id }
    
  } catch (error) {
    console.error('❌ Error enviando recordatorio al admin:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Enviar recordatorio sugerente al cliente sobre fecha especial próxima
 */
export async function enviarRecordatorioCliente(contacto, cliente, diasRestantes) {
  try {
    const { data, error } = await resend.emails.send({
      from: `Blooment 🌸 <${SENDER_EMAIL}>`,
      to: [cliente.email],
      subject: `🌸 ¡Se acerca el ${contacto.motivo} de ${contacto.nombre}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; border: 2px solid #F5B6C6; border-radius: 10px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #F5B6C6 0%, #FFD1DC 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🌸 ¡No lo olvides!</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">¡Hola <strong>${cliente.nombre}</strong>!</p>
            
            <div style="background-color: #FFF5F7; border-left: 4px solid #F5B6C6; padding: 15px; margin: 20px 0;">
              <p style="font-size: 18px; color: #F5B6C6; font-weight: bold; margin: 0;">
                Se acerca el <strong>${contacto.motivo}</strong> de <strong>${contacto.nombre}</strong> 🎉
              </p>
              <p style="font-size: 14px; color: #666; margin: 10px 0 0 0;">
                Faltan ${diasRestantes} días - ${new Date(contacto.fecha_especial).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
              </p>
            </div>
            
            <p style="font-size: 16px; color: #333;">
              ¿Te gustaría apartar las flores favoritas de <strong>${contacto.nombre}</strong> de una vez? 
              Tenemos arreglos hermosos listos para sorprender en esta fecha especial.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/tienda" style="display: inline-block; padding: 15px 40px; background-color: #F5B6C6; color: white; text-decoration: none; font-weight: bold; border-radius: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                Ver Catálogo 🌺
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
              Hacemos entregas a: ${contacto.direccion}
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #F5B6C6; font-weight: bold; font-size: 16px;">¡Que cada fecha especial sea inolvidable! 💐</p>
              <p style="color: #666; font-size: 14px;">El equipo de Blooment</p>
            </div>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('❌ Error de Resend al enviar recordatorio a cliente:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Recordatorio por email enviado al cliente ${cliente.email}. ID:`, data.id)

    // Enviar también por WhatsApp (no bloqueante)
    setImmediate(async () => {
      try {
        const resultadoWhatsApp = await enviarRecordatorioWhatsApp(contacto, cliente, diasRestantes)
        if (resultadoWhatsApp.success) {
          console.log(`✅ Recordatorio por WhatsApp enviado al cliente ${cliente.nombre}`)
        } else {
          console.log(`⚠️ No se pudo enviar recordatorio por WhatsApp:`, resultadoWhatsApp.error)
        }
      } catch (whatsappError) {
        console.error('⚠️ Error enviando recordatorio por WhatsApp (no crítico):', whatsappError)
      }
    })

    return { success: true, messageId: data.id }
    
  } catch (error) {
    console.error('❌ Error enviando recordatorio al cliente:', error)
    return { success: false, error: error.message }
  }
}
