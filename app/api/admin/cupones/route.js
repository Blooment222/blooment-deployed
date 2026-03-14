import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

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

// GET /api/admin/cupones - Listar cupones (PROTEGIDO)
export async function GET(request) {
  const authResult = await verifyAuth(request)
  
  if (!authResult.authenticated) {
    return handleCORS(NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    ))
  }

  try {
    const cupones = await prisma.cupon.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return handleCORS(NextResponse.json(cupones))
  } catch (error) {
    console.error('Error obteniendo cupones:', error)
    return handleCORS(NextResponse.json(
      { error: "Error al obtener cupones" },
      { status: 500 }
    ))
  }
}

// POST /api/admin/cupones - Crear nuevo cupón (PROTEGIDO)
export async function POST(request) {
  const authResult = await verifyAuth(request)
  
  if (!authResult.authenticated) {
    return handleCORS(NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    ))
  }

  try {
    const body = await request.json()
    const { codigo, tipo, valor, monto_minimo, fecha_fin } = body

    // Validar código único
    const existente = await prisma.cupon.findUnique({
      where: { codigo: codigo.toUpperCase() }
    })

    if (existente) {
      return handleCORS(NextResponse.json(
        { error: "Ya existe un cupón con ese código" },
        { status: 400 }
      ))
    }

    const cupon = await prisma.cupon.create({
      data: {
        codigo: codigo.toUpperCase(),
        tipo,
        valor: parseFloat(valor),
        activo: true,
        monto_minimo: monto_minimo ? parseFloat(monto_minimo) : null,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : null
      }
    })

    return handleCORS(NextResponse.json(cupon, { status: 201 }))
  } catch (error) {
    console.error('Error creando cupón:', error)
    return handleCORS(NextResponse.json(
      { error: "Error al crear cupón" },
      { status: 500 }
    ))
  }
}
