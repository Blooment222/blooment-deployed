import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// POST /api/cupones/validar - Validar y aplicar cupón (PÚBLICO)
export async function POST(request) {
  try {
    const body = await request.json()
    const { codigo, monto_pedido } = body

    if (!codigo) {
      return handleCORS(NextResponse.json(
        { error: "El código del cupón es requerido" },
        { status: 400 }
      ))
    }

    const cupon = await prisma.cupon.findUnique({
      where: { codigo: codigo.toUpperCase() }
    })

    if (!cupon) {
      return handleCORS(NextResponse.json(
        { error: "Este cupón no es válido" },
        { status: 404 }
      ))
    }

    if (!cupon.activo) {
      return handleCORS(NextResponse.json(
        { error: "Este cupón ya no está activo" },
        { status: 400 }
      ))
    }

    // Verificar fecha de expiración
    const ahora = new Date()
    if (cupon.fecha_fin && new Date(cupon.fecha_fin) < ahora) {
      return handleCORS(NextResponse.json(
        { error: "Este cupón ha caducado" },
        { status: 400 }
      ))
    }

    if (new Date(cupon.fecha_inicio) > ahora) {
      return handleCORS(NextResponse.json(
        { error: "Este cupón aún no es válido" },
        { status: 400 }
      ))
    }

    // Verificar usos máximos
    if (cupon.usos_maximos && cupon.usos >= cupon.usos_maximos) {
      return handleCORS(NextResponse.json(
        { error: "Este cupón ha alcanzado su límite de usos" },
        { status: 400 }
      ))
    }

    // Verificar monto mínimo
    if (cupon.monto_minimo && monto_pedido < cupon.monto_minimo) {
      return handleCORS(NextResponse.json(
        { error: `Este cupón requiere una compra mínima de MXN $${cupon.monto_minimo.toFixed(2)}` },
        { status: 400 }
      ))
    }

    // Calcular descuento
    let descuento = 0
    if (cupon.tipo === 'porcentaje') {
      descuento = (monto_pedido * cupon.valor) / 100
    } else if (cupon.tipo === 'monto_fijo') {
      descuento = cupon.valor
    }

    // No permitir que el descuento sea mayor que el monto del pedido
    descuento = Math.min(descuento, monto_pedido)

    return handleCORS(NextResponse.json({
      valido: true,
      codigo: cupon.codigo,
      tipo: cupon.tipo,
      valor: cupon.valor,
      descuento: descuento,
      mensaje: `Cupón aplicado: ${cupon.tipo === 'porcentaje' ? cupon.valor + '%' : 'MXN $' + cupon.valor} de descuento`
    }))

  } catch (error) {
    console.error('Error validando cupón:', error)
    return handleCORS(NextResponse.json(
      { error: "Error al validar el cupón" },
      { status: 500 }
    ))
  }
}
