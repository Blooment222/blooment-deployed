import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateToken, hashPassword } from '@/lib/auth'

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

// POST /api/clientes/register - Registrar nuevo cliente
export async function POST(request) {
  try {
    const body = await request.json()
    
    if (!body.nombre || !body.email || !body.password) {
      return handleCORS(NextResponse.json(
        { error: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      ))
    }

    // Verificar si el email ya existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { email: body.email }
    })

    if (existingCliente) {
      return handleCORS(NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      ))
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(body.password)

    // Crear cliente Y usuario en una transacción
    const cliente = await prisma.$transaction(async (tx) => {
      // Crear cliente
      const nuevoCliente = await tx.cliente.create({
        data: {
          nombre: body.nombre,
          email: body.email,
          password: hashedPassword,
          telefono: body.telefono || null,
          direccion: body.direccion || null,
          activo: true
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          direccion: true,
          createdAt: true
        }
      })

      // Crear usuario con el mismo ID (para satisfacer foreign key constraint)
      await tx.usuario.create({
        data: {
          id: nuevoCliente.id,
          nombre: nuevoCliente.nombre,
          email: nuevoCliente.email,
          telefono: nuevoCliente.telefono || '',
          direccion: nuevoCliente.direccion || ''
        }
      })

      console.log('✅ Cliente y Usuario creados:', nuevoCliente.email)

      return nuevoCliente
    })

    // Generar token
    const token = generateToken({ 
      userId: cliente.id, 
      email: cliente.email,
      type: 'cliente'
    })

    return handleCORS(NextResponse.json({
      token,
      user: cliente
    }, { status: 201 }))
  } catch (error) {
    console.error('Error en registro de cliente:', error)
    return handleCORS(NextResponse.json(
      { error: "Error al registrar cliente" },
      { status: 500 }
    ))
  }
}
