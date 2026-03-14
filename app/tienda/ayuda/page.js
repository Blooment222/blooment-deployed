'use client'

import React, { useState } from 'react'
import { useClienteAuth } from '@/lib/cliente-auth'
import { useRouter } from 'next/navigation'
import { TiendaLayoutWrapper } from '@/components/TiendaLayoutWrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { HelpCircle, Send, Mail } from 'lucide-react'

function AyudaContent() {
  const { user, getToken } = useClienteAuth()
  const router = useRouter()
  const [formContacto, setFormContacto] = useState({ asunto: '', mensaje: '' })
  const [enviando, setEnviando] = useState(false)

  const handleEnviarMensaje = async (e) => {
    e.preventDefault()
    
    if (!user) {
      alert('Debes iniciar sesión para enviar un mensaje')
      router.push('/tienda/login')
      return
    }

    setEnviando(true)
    
    try {
      const token = getToken()
      const response = await fetch('/api/contacto/ayuda', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formContacto)
      })

      const data = await response.json()

      if (response.ok) {
        alert('✅ Mensaje enviado exitosamente. Te responderemos pronto a tu email.')
        setFormContacto({ asunto: '', mensaje: '' })
      } else {
        alert('❌ Error: ' + (data.error || 'No se pudo enviar el mensaje'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error al enviar el mensaje. Por favor intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-24">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-[#F5B6C6]/20 flex items-center justify-center">
            <HelpCircle className="w-10 h-10 text-[#F5B6C6]" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-black">Centro de Ayuda</h1>
        <p className="text-gray-600 text-lg">¿Tienes alguna duda? Estamos aquí para ayudarte</p>
      </div>

      {/* Preguntas Frecuentes */}
      <Card className="shadow-lg rounded-2xl border-[#F5B6C6]/30">
        <CardHeader className="bg-gradient-to-r from-[#F5B6C6]/10 to-white border-b border-[#F5B6C6]/20">
          <CardTitle className="text-2xl font-bold text-black">Preguntas Frecuentes</CardTitle>
          <CardDescription className="text-gray-600">
            Encuentra respuestas rápidas a las preguntas más comunes
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="w-full">
            {/* Categoría: Entregas */}
            <AccordionItem value="entregas" className="border-b border-gray-200">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="text-lg font-semibold text-black">🚚 Entregas</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#F5B6C6]">
                  <h4 className="font-semibold text-black mb-2">¿Cuánto tarda mi pedido?</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Los pedidos se entregan el mismo día si lo haces antes de las 12:00 PM. 
                    Pedidos después de esa hora se entregarán al día siguiente entre 10:00 AM y 6:00 PM.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#F5B6C6]">
                  <h4 className="font-semibold text-black mb-2">¿Llegan a mi zona?</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Realizamos entregas en toda la Ciudad de México y área metropolitana. 
                    Puedes verificar la disponibilidad ingresando tu dirección en el checkout.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#F5B6C6]">
                  <h4 className="font-semibold text-black mb-2">¿Puedo programar la entrega?</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Sí, puedes elegir tu horario preferido durante el checkout: mañana (10:00-13:00), 
                    tarde (13:00-15:00) o noche (15:00-18:00).
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Categoría: Pagos */}
            <AccordionItem value="pagos" className="border-b border-gray-200">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="text-lg font-semibold text-black">💳 Pagos</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#F5B6C6]">
                  <h4 className="font-semibold text-black mb-2">¿Es seguro mi pago?</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Completamente seguro. Utilizamos Stripe, una plataforma de pagos reconocida mundialmente. 
                    Tus datos bancarios están encriptados y nunca los almacenamos en nuestros servidores.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#F5B6C6]">
                  <h4 className="font-semibold text-black mb-2">¿Aceptan transferencias?</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Actualmente solo aceptamos pagos con tarjeta de crédito o débito a través de nuestra 
                    plataforma segura. Trabajamos en agregar más métodos de pago pronto.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#F5B6C6]">
                  <h4 className="font-semibold text-black mb-2">¿Puedo pagar contra entrega?</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Por el momento solo aceptamos pago anticipado con tarjeta para garantizar la 
                    disponibilidad de tus flores frescas.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Categoría: Cupones */}
            <AccordionItem value="cupones" className="border-b border-gray-200">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="text-lg font-semibold text-black">🎟️ Cupones</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#F5B6C6]">
                  <h4 className="font-semibold text-black mb-2">¿Cómo aplico mi código de descuento?</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    En el carrito de compras, encontrarás un campo que dice "¿Tienes un cupón?". 
                    Ingresa tu código allí y presiona "Aplicar". El descuento se reflejará automáticamente 
                    en el total.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#F5B6C6]">
                  <h4 className="font-semibold text-black mb-2">¿Por qué no funciona mi cupón?</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Los cupones pueden tener restricciones: monto mínimo de compra, fecha de vencimiento, 
                    o límite de usos. Verifica que tu cupón esté vigente y que tu compra cumpla los requisitos.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#F5B6C6]">
                  <h4 className="font-semibold text-black mb-2">¿Puedo usar más de un cupón?</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Solo puedes usar un código de descuento por pedido. El sistema aplicará 
                    automáticamente el que te dé mayor beneficio.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Categoría: Cancelaciones */}
            <AccordionItem value="cancelaciones" className="border-b-0">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="text-lg font-semibold text-black">❌ Cancelaciones</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#F5B6C6]">
                  <h4 className="font-semibold text-black mb-2">¿Puedo cancelar mi pedido?</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Sí, puedes cancelar tu pedido sin costo mientras esté en estado "Pedido Recibido". 
                    Ve a "Mi Cuenta" → "Mis Pedidos" y presiona el botón "Cancelar Pedido".
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#F5B6C6]">
                  <h4 className="font-semibold text-black mb-2">¿Puedo cancelar si ya está en preparación?</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Desafortunadamente, una vez que el arreglo está en preparación, no podemos cancelar 
                    el pedido ya que las flores han sido cortadas especialmente para ti. 
                    Contáctanos si hay algún problema urgente.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#F5B6C6]">
                  <h4 className="font-semibold text-black mb-2">¿Cuándo recibiré mi reembolso?</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Los reembolsos por cancelaciones se procesan automáticamente en 5-7 días hábiles 
                    a tu método de pago original.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Formulario de Contacto */}
      <Card className="shadow-lg rounded-2xl border-[#F5B6C6]/30">
        <CardHeader className="bg-gradient-to-r from-[#F5B6C6]/10 to-white border-b border-[#F5B6C6]/20">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-[#F5B6C6]" />
            <div>
              <CardTitle className="text-2xl font-bold text-black">¿No encontraste tu respuesta?</CardTitle>
              <CardDescription className="text-gray-600">
                Envíanos un mensaje y te responderemos pronto
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {!user ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Debes iniciar sesión para enviar un mensaje</p>
              <Button
                onClick={() => router.push('/tienda/login')}
                className="bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white rounded-full px-8"
              >
                Iniciar Sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEnviarMensaje} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-black font-semibold">Asunto</Label>
                <Input
                  value={formContacto.asunto}
                  onChange={(e) => setFormContacto({ ...formContacto, asunto: e.target.value })}
                  placeholder="¿En qué podemos ayudarte?"
                  required
                  className="border-gray-300 focus:border-[#F5B6C6] focus:ring-[#F5B6C6] rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-black font-semibold">Mensaje</Label>
                <Textarea
                  value={formContacto.mensaje}
                  onChange={(e) => setFormContacto({ ...formContacto, mensaje: e.target.value })}
                  placeholder="Describe tu consulta con el mayor detalle posible..."
                  required
                  rows={6}
                  className="border-gray-300 focus:border-[#F5B6C6] focus:ring-[#F5B6C6] rounded-lg resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>📧 Te responderemos a:</strong> {user.email}
                </p>
              </div>

              <Button
                type="submit"
                disabled={enviando}
                className="w-full bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white rounded-full py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {enviando ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Enviar Mensaje
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Info adicional */}
      <div className="text-center space-y-2 pt-4">
        <p className="text-gray-600 text-sm">
          También puedes escribirnos directamente a: 
          <a href="mailto:blooment222@gmail.com" className="text-[#F5B6C6] font-semibold ml-1 hover:underline">
            blooment222@gmail.com
          </a>
        </p>
        <p className="text-gray-500 text-xs">
          Tiempo de respuesta promedio: 24 horas
        </p>
      </div>
    </div>
  )
}

export default function AyudaPage() {
  return (
    <TiendaLayoutWrapper>
      <AyudaContent />
    </TiendaLayoutWrapper>
  )
}
