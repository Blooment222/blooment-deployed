/**
 * Endpoint de prueba para verificar que el sistema de emails con Resend funciona
 */

import { NextResponse } from 'next/server'
import { enviarNotificacionCliente } from '@/lib/email'

export async function GET(request) {
  try {
    console.log('🧪 Iniciando prueba de email con Resend...')
    
    // Datos de prueba
    const pedidoTest = {
      id: 'test-' + Date.now(),
      total: 599.99,
      direccion_entrega: 'Av. Paseo de la Reforma 222, CDMX',
      horario_entrega: '10:00 AM - 2:00 PM',
      estado: 'pendiente'
    }
    
    const clienteTest = {
      nombre: 'Cliente de Prueba',
      email: 'blooment222@gmail.com' // Email del admin para recibir la prueba
    }
    
    const resultado = await enviarNotificacionCliente(
      pedidoTest, 
      clienteTest, 
      'pendiente'
    )
    
    if (resultado.success) {
      return NextResponse.json({
        success: true,
        message: '✅ Email de prueba enviado correctamente',
        messageId: resultado.messageId,
        enviado_a: clienteTest.email
      })
    } else {
      return NextResponse.json({
        success: false,
        message: '❌ Error al enviar email de prueba',
        error: resultado.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Error en test-email:', error)
    return NextResponse.json({
      success: false,
      message: 'Error en el endpoint de prueba',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
