import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateToken, comparePassword } from '@/lib/auth'

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

// POST /api/clientes/login - Login de cliente
export async function POST(request) {
  try {
    const body = await request.json()
    
    if (!body.email || !body.password) {
      return handleCORS(NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      ))
    }

    // Buscar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { email: body.email }
    })

    if (!cliente) {
      return handleCORS(NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      ))
    }

    // Verificar contraseña
    const validPassword = await comparePassword(body.password, cliente.password)
    
    if (!validPassword) {
      return handleCORS(NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      ))
    }

    // Verificar que esté activo
    if (!cliente.activo) {
      return handleCORS(NextResponse.json(
        { error: "Usuario inactivo" },
        { status: 403 }
      ))
    }

    // Generar token
    const token = generateToken({ 
      userId: cliente.id, 
      email: cliente.email,
      type: 'cliente'
    })

    return handleCORS(NextResponse.json({
      token,
      user: {
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion
      }
    }))
  } catch (error) {
    console.error('Error en login de cliente:', error)
    return handleCORS(NextResponse.json(
      { error: "Error al iniciar sesión" },
      { status: 500 }
    ))
  }
}
