import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyClientAuth } from '@/lib/auth'

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

// GET /api/clientes/pedidos - Obtener pedidos del cliente
export async function GET(request) {
  const authResult = await verifyClientAuth(request)
  
  if (!authResult.authenticated) {
    return handleCORS(NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    ))
  }

  try {
    const pedidos = await prisma.pedido.findMany({
      where: { clienteId: authResult.user.userId },
      include: {
        detallesPedido: {
          include: {
            producto: {
              select: {
                nombre: true,
                imagen_url: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return handleCORS(NextResponse.json(pedidos))
  } catch (error) {
    console.error('Error obteniendo pedidos del cliente:', error)
    return handleCORS(NextResponse.json(
      { error: "Error al obtener pedidos" },
      { status: 500 }
    ))
  }
}
