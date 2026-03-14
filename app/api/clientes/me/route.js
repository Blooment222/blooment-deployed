import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyClientAuth, generateToken, comparePassword, hashPassword } from '@/lib/auth'

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

// GET /api/clientes/me - Obtener cliente actual
export async function GET(request) {
  const authResult = await verifyClientAuth(request)
  
  if (!authResult.authenticated) {
    return handleCORS(NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    ))
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id: authResult.user.userId },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      direccion: true,
      createdAt: true
    }
  })

  if (!cliente) {
    return handleCORS(NextResponse.json(
      { error: "Cliente no encontrado" },
      { status: 404 }
    ))
  }

  return handleCORS(NextResponse.json({ user: cliente }))
}

// PUT /api/clientes/me - Actualizar datos del cliente
export async function PUT(request) {
  const authResult = await verifyClientAuth(request)
  
  if (!authResult.authenticated) {
    return handleCORS(NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    ))
  }

  const body = await request.json()
  
  const updateData = {}
  if (body.nombre) updateData.nombre = body.nombre
  if (body.telefono !== undefined) updateData.telefono = body.telefono
  if (body.direccion !== undefined) updateData.direccion = body.direccion

  const cliente = await prisma.cliente.update({
    where: { id: authResult.user.userId },
    data: updateData,
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      direccion: true,
      updatedAt: true
    }
  })

  return handleCORS(NextResponse.json(cliente))
}
