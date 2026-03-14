import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// PATCH /api/admin/cupones/[id] - Actualizar cupón (PROTEGIDO)
export async function PATCH(request, { params }) {
  const authResult = await verifyAuth(request)
  
  if (!authResult.authenticated) {
    return handleCORS(NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    ))
  }

  try {
    const { id } = params
    const body = await request.json()

    const cupon = await prisma.cupon.update({
      where: { id },
      data: body
    })

    return handleCORS(NextResponse.json(cupon))
  } catch (error) {
    console.error('Error actualizando cupón:', error)
    return handleCORS(NextResponse.json(
      { error: "Error al actualizar cupón" },
      { status: 500 }
    ))
  }
}

// DELETE /api/admin/cupones/[id] - Eliminar cupón (PROTEGIDO)
export async function DELETE(request, { params }) {
  const authResult = await verifyAuth(request)
  
  if (!authResult.authenticated) {
    return handleCORS(NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    ))
  }

  try {
    const { id } = params

    await prisma.cupon.delete({
      where: { id }
    })

    return handleCORS(NextResponse.json({ success: true }))
  } catch (error) {
    console.error('Error eliminando cupón:', error)
    return handleCORS(NextResponse.json(
      { error: "Error al eliminar cupón" },
      { status: 500 }
    ))
  }
}
