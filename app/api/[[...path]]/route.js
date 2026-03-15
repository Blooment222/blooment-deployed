import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth, verifyClientAuth, generateToken, comparePassword, hashPassword } from '@/lib/auth'
import Stripe from 'stripe'
import { notificarNuevoPedidoWhatsApp, confirmarPedidoWhatsApp, actualizarEstadoPedidoWhatsApp } from '@/lib/whatsapp'

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // ============================================
    // ROOT ENDPOINTS
    // ============================================
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ 
        message: "API de Venta de Flores", 
        version: "1.0.0",
        endpoints: {
          auth: "/api/auth",
          usuarios: "/api/usuarios",
          productos: "/api/productos",
          pedidos: "/api/pedidos",
          detalles_pedido: "/api/detalles-pedido",
          pagos: "/api/pagos"
        }
      }))
    }

    // ============================================
    // AUTHENTICATION ENDPOINTS
    // ============================================
    
    // POST /api/auth/login - Login de administrador
    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      
      if (!body.email || !body.password) {
        return handleCORS(NextResponse.json(
          { error: "Email y contraseña son requeridos" },
          { status: 400 }
        ))
      }

      // Whitelist de administradores permitidos
      const ADMIN_WHITELIST = [
        'diegoah1107@gmail.com',
        'maireyesguevara@gmail.com'
      ]

      // Verificar si el email está en la whitelist
      if (!ADMIN_WHITELIST.includes(body.email.toLowerCase())) {
        return handleCORS(NextResponse.json(
          { error: "Acceso no autorizado" },
          { status: 403 }
        ))
      }

      // Buscar administrador
      const admin = await prisma.administrador.findUnique({
        where: { email: body.email.toLowerCase() }
      })

      if (!admin) {
        return handleCORS(NextResponse.json(
          { error: "Credenciales inválidas" },
          { status: 401 }
        ))
      }

      // Verificar contraseña
      const validPassword = await comparePassword(body.password, admin.password)
      
      if (!validPassword) {
        return handleCORS(NextResponse.json(
          { error: "Credenciales inválidas" },
          { status: 401 }
        ))
      }

      // Verificar que esté activo
      if (!admin.activo) {
        return handleCORS(NextResponse.json(
          { error: "Usuario inactivo" },
          { status: 403 }
        ))
      }

      // Generar token
      const token = generateToken({ userId: admin.id, email: admin.email })

      return handleCORS(NextResponse.json({
        token,
        user: {
          id: admin.id,
          nombre: admin.nombre,
          email: admin.email
        }
      }))
    }

    // GET /api/auth/me - Obtener usuario actual
    if (route === '/auth/me' && method === 'GET') {
      const authResult = await verifyAuth(request)
      
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: authResult.error },
          { status: 401 }
        ))
      }

      return handleCORS(NextResponse.json({
        user: authResult.user
      }))
    }

    // POST /api/auth/register - Registrar nuevo administrador (protegido)
    if (route === '/auth/register' && method === 'POST') {
      // Verificar autenticación
      const authResult = await verifyAuth(request)
      
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        ))
      }

      const body = await request.json()
      
      if (!body.nombre || !body.email || !body.password) {
        return handleCORS(NextResponse.json(
          { error: "Nombre, email y contraseña son requeridos" },
          { status: 400 }
        ))
      }

      // Verificar si el email ya existe
      const existingAdmin = await prisma.administrador.findUnique({
        where: { email: body.email }
      })

      if (existingAdmin) {
        return handleCORS(NextResponse.json(
          { error: "El email ya está registrado" },
          { status: 409 }
        ))
      }

      // Hashear contraseña
      const hashedPassword = await hashPassword(body.password)

      // Crear administrador
      const admin = await prisma.administrador.create({
        data: {
          nombre: body.nombre,
          email: body.email,
          password: hashedPassword,
          activo: true
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          activo: true,
          createdAt: true
        }
      })

      return handleCORS(NextResponse.json(admin, { status: 201 }))
    }

    // ============================================
    // FINANZAS / ANALYTICS ENDPOINTS
    // ============================================
    
    // GET /api/finanzas/metricas - Obtener métricas financieras (PROTEGIDO)
    if (route === '/finanzas/metricas' && method === 'GET') {
      const authResult = await verifyAuth(request)
      
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        ))
      }

      try {
        // Obtener parámetros de filtro de fecha
        const url = new URL(request.url)
        const periodo = url.searchParams.get('periodo') || 'mes' // dia, semana, mes, año
        
        // Calcular fecha de inicio según período
        const ahora = new Date()
        let fechaInicio = new Date()
        
        switch(periodo) {
          case 'dia':
            fechaInicio.setHours(0, 0, 0, 0)
            break
          case 'semana':
            fechaInicio.setDate(ahora.getDate() - 7)
            break
          case 'mes':
            fechaInicio.setMonth(ahora.getMonth() - 1)
            break
          case 'año':
            fechaInicio.setFullYear(ahora.getFullYear() - 1)
            break
        }

        // Obtener pedidos del período
        const pedidos = await prisma.pedido.findMany({
          where: {
            createdAt: {
              gte: fechaInicio
            }
          },
          include: {
            detallesPedido: {
              include: {
                producto: true
              }
            }
          }
        })

        // Calcular métricas
        let ventasTotales = 0
        let costoProductos = 0
        let costoEnvios = 0
        let descuentos = 0
        const numeroPedidos = pedidos.length

        pedidos.forEach(pedido => {
          ventasTotales += pedido.total
          
          // Calcular costo de productos
          pedido.detallesPedido.forEach(detalle => {
            // Asumir 40% del precio de venta como costo del producto (margen del 60%)
            const costoUnitario = detalle.precio_unitario * 0.4
            costoProductos += costoUnitario * detalle.cantidad
          })
          
          // El costo de envío base es de $99 por pedido
          costoEnvios += 99
        })

        const costosTotales = costoProductos + costoEnvios
        const utilidadNeta = ventasTotales - costosTotales

        // Calcular promedio por pedido
        const ticketPromedio = numeroPedidos > 0 ? ventasTotales / numeroPedidos : 0

        // Pedidos por estado
        const pedidosPorEstado = {
          pendiente: pedidos.filter(p => p.estado === 'pendiente').length,
          en_preparacion: pedidos.filter(p => p.estado === 'en_preparacion').length,
          enviado: pedidos.filter(p => p.estado === 'enviado').length,
          entregado: pedidos.filter(p => p.estado === 'entregado').length,
          cancelado: pedidos.filter(p => p.estado === 'cancelado').length
        }

        // Productos más vendidos
        const productosVendidos = {}
        pedidos.forEach(pedido => {
          pedido.detallesPedido.forEach(detalle => {
            if (!productosVendidos[detalle.productoId]) {
              productosVendidos[detalle.productoId] = {
                nombre: detalle.producto.nombre,
                cantidad: 0,
                ingresos: 0
              }
            }
            productosVendidos[detalle.productoId].cantidad += detalle.cantidad
            productosVendidos[detalle.productoId].ingresos += detalle.subtotal
          })
        })

        const topProductos = Object.values(productosVendidos)
          .sort((a, b) => b.ingresos - a.ingresos)
          .slice(0, 5)

        return handleCORS(NextResponse.json({
          periodo,
          fecha_inicio: fechaInicio,
          fecha_fin: ahora,
          resumen: {
            ventas_totales: ventasTotales,
            costos_totales: costosTotales,
            costo_productos: costoProductos,
            costo_envios: costoEnvios,
            descuentos: descuentos,
            utilidad_neta: utilidadNeta,
            margen_utilidad: ventasTotales > 0 ? (utilidadNeta / ventasTotales * 100) : 0,
            numero_pedidos: numeroPedidos,
            ticket_promedio: ticketPromedio
          },
          pedidos_por_estado: pedidosPorEstado,
          top_productos: topProductos
        }))

      } catch (error) {
        console.error('Error obteniendo métricas financieras:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al calcular métricas financieras" },
          { status: 500 }
        ))
      }
    }

    // ============================================
    // SECURITY ENDPOINTS (Panel Visual)
    // ============================================

    // GET /api/security/admins - Listar administradores (PROTEGIDO)
    if (route === '/security/admins' && method === 'GET') {
      const authResult = await verifyAuth(request)
      
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        ))
      }

      const admins = await prisma.administrador.findMany({
        select: {
          id: true,
          nombre: true,
          email: true,
          activo: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      })

      return handleCORS(NextResponse.json(admins))
    }

    // POST /api/security/change-password - Cambiar contraseña (PROTEGIDO)
    if (route === '/security/change-password' && method === 'POST') {
      const authResult = await verifyAuth(request)
      
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        ))
      }

      const body = await request.json()
      
      if (!body.currentPassword || !body.newPassword) {
        return handleCORS(NextResponse.json(
          { error: "Contraseña actual y nueva son requeridas" },
          { status: 400 }
        ))
      }

      // Obtener admin actual
      const admin = await prisma.administrador.findUnique({
        where: { id: authResult.user.id }
      })

      if (!admin) {
        return handleCORS(NextResponse.json(
          { error: "Administrador no encontrado" },
          { status: 404 }
        ))
      }

      // Verificar contraseña actual
      const validPassword = await comparePassword(body.currentPassword, admin.password)
      
      if (!validPassword) {
        return handleCORS(NextResponse.json(
          { error: "Contraseña actual incorrecta" },
          { status: 401 }
        ))
      }

      // Hashear nueva contraseña
      const hashedPassword = await hashPassword(body.newPassword)

      // Actualizar contraseña
      await prisma.administrador.update({
        where: { id: admin.id },
        data: { password: hashedPassword }
      })

      // Enviar notificación por email
      try {
        const { sendPasswordChangeNotification } = await import('@/lib/email')
        // await sendPasswordChangeNotification(admin.email, authResult.user.email)
        console.log('📧 Notificación de cambio de contraseña (email desactivado temporalmente)')
      } catch (emailError) {
        console.error('Error al enviar email:', emailError)
        // No fallar la operación si el email falla
      }

      return handleCORS(NextResponse.json({
        message: "Contraseña cambiada exitosamente",
        emailSent: false // Temporalmente desactivado
      }))
    }

    // POST /api/security/create-admin - Crear nuevo administrador (PROTEGIDO)
    if (route === '/security/create-admin' && method === 'POST') {
      const authResult = await verifyAuth(request)
      
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        ))
      }

      const body = await request.json()
      
      if (!body.nombre || !body.email || !body.password) {
        return handleCORS(NextResponse.json(
          { error: "Nombre, email y contraseña son requeridos" },
          { status: 400 }
        ))
      }

      // Verificar si el email ya existe
      const existingAdmin = await prisma.administrador.findUnique({
        where: { email: body.email }
      })

      if (existingAdmin) {
        return handleCORS(NextResponse.json(
          { error: "Ya existe un administrador con ese email" },
          { status: 409 }
        ))
      }

      // Hashear contraseña
      const hashedPassword = await hashPassword(body.password)

      // Crear administrador
      const newAdmin = await prisma.administrador.create({
        data: {
          nombre: body.nombre,
          email: body.email,
          password: hashedPassword,
          activo: true
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          activo: true,
          createdAt: true
        }
      })

      // Enviar notificación por email
      try {
        const { sendNewAdminNotification } = await import('@/lib/email')
        // await sendNewAdminNotification(newAdmin.email, newAdmin.nombre, authResult.user.email)
        console.log('📧 Notificación de nuevo admin (email desactivado temporalmente)')
      } catch (emailError) {
        console.error('Error al enviar email:', emailError)
        // No fallar la operación si el email falla
      }

      return handleCORS(NextResponse.json({
        ...newAdmin,
        message: "Administrador creado exitosamente",
        emailSent: false // Temporalmente desactivado
      }, { status: 201 }))
    }

    // PUT /api/security/deactivate-admin/:id - Desactivar administrador (PROTEGIDO)
    const deactivateAdminMatch = route.match(/^\/security\/deactivate-admin\/([^\/]+)$/)
    if (deactivateAdminMatch && method === 'PUT') {
      const authResult = await verifyAuth(request)
      
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        ))
      }

      const adminId = deactivateAdminMatch[1]

      // No permitir auto-desactivación
      if (adminId === authResult.user.id) {
        return handleCORS(NextResponse.json(
          { error: "No puedes desactivarte a ti mismo" },
          { status: 400 }
        ))
      }

      // Verificar que no sea el último admin activo
      const activeAdmins = await prisma.administrador.count({
        where: { activo: true }
      })

      if (activeAdmins <= 1) {
        return handleCORS(NextResponse.json(
          { error: "No puedes desactivar el último administrador activo" },
          { status: 400 }
        ))
      }

      // Desactivar administrador
      await prisma.administrador.update({
        where: { id: adminId },
        data: { activo: false }
      })

      return handleCORS(NextResponse.json({
        message: "Administrador desactivado exitosamente"
      }))
    }

    // ============================================
    // ADMIN - CLIENTES ENDPOINTS  
    // ============================================

    // GET /api/admin/clientes - Obtener todos los clientes (PROTEGIDO)
    if (route === '/admin/clientes' && method === 'GET') {
      const authResult = await verifyAuth(request)
      
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        ))
      }

      const clientes = await prisma.cliente.findMany({
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          direccion: true,
          activo: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return handleCORS(NextResponse.json(clientes))
    }

    // ============================================
    // CLIENTES ENDPOINTS (Usuarios de la tienda)
    // ============================================

    // POST /api/clientes/register - Registrar nuevo cliente
    if (route === '/clientes/register' && method === 'POST') {
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
            id: nuevoCliente.id, // Mismo ID que el cliente
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
    }

    // POST /api/clientes/login - Login de cliente
    if (route === '/clientes/login' && method === 'POST') {
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
    }

    // POST /api/auth/google/callback - Procesar callback de Google OAuth (Emergent Auth)
    if (route === '/auth/google/callback' && method === 'POST') {
      try {
        const body = await request.json()
        
        if (!body.session_id) {
          return handleCORS(NextResponse.json(
            { error: "session_id es requerido" },
            { status: 400 }
          ))
        }

        console.log('🔑 Procesando Google OAuth callback...')

        // Llamar a Emergent Auth para obtener datos del usuario
        const emergentResponse = await fetch('https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data', {
          headers: {
            'X-Session-ID': body.session_id
          }
        })

        if (!emergentResponse.ok) {
          console.error('❌ Error de Emergent Auth:', emergentResponse.status)
          return handleCORS(NextResponse.json(
            { error: "Error al verificar sesión con Google" },
            { status: 401 }
          ))
        }

        const googleUser = await emergentResponse.json()
        console.log('✅ Datos de Google recibidos:', { email: googleUser.email, name: googleUser.name })

        // Buscar o crear cliente
        let cliente = await prisma.cliente.findUnique({
          where: { email: googleUser.email }
        })

        if (!cliente) {
          // Crear nuevo cliente desde Google
          console.log('📝 Creando nuevo cliente desde Google...')
          cliente = await prisma.cliente.create({
            data: {
              nombre: googleUser.name,
              email: googleUser.email,
              password: 'google_oauth', // Password placeholder para usuarios de Google
              activo: true
            }
          })
          console.log('✅ Cliente creado:', cliente.id)
        } else {
          console.log('✅ Cliente existente encontrado:', cliente.id)
        }

        // Generar token JWT para el cliente
        const token = generateToken({ 
          userId: cliente.id, 
          email: cliente.email,
          type: 'cliente'
        })

        // Preparar response con token
        const response = NextResponse.json({
          success: true,
          user: {
            id: cliente.id,
            nombre: cliente.nombre,
            email: cliente.email,
            telefono: cliente.telefono,
            direccion: cliente.direccion
          }
        })

        // Configurar cookie con el token
        response.cookies.set('cliente_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 días
          path: '/'
        })

        console.log('✅ Google OAuth completado exitosamente')
        return handleCORS(response)

      } catch (error) {
        console.error('❌ Error en Google OAuth callback:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al procesar autenticación con Google" },
          { status: 500 }
        ))
      }
    }

    // GET /api/clientes/me - Obtener cliente actual
    if (route === '/clientes/me' && method === 'GET') {
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
    if (route === '/clientes/me' && method === 'PUT') {
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

    // POST /api/clientes/push-token - Guardar push token de OneSignal
    if (route === '/clientes/push-token' && method === 'POST') {
      const authResult = await verifyClientAuth(request)
      
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        ))
      }

      const body = await request.json()
      const { push_token } = body

      if (!push_token) {
        return handleCORS(NextResponse.json(
          { error: "push_token es requerido" },
          { status: 400 }
        ))
      }

      try {
        const cliente = await prisma.cliente.update({
          where: { id: authResult.user.userId },
          data: {
            push_token,
            push_enabled: true,
            push_subscribed_at: new Date()
          }
        })

        console.log(`✅ Push token guardado para cliente ${cliente.email}`)
        return handleCORS(NextResponse.json({ 
          success: true,
          message: 'Push token guardado exitosamente' 
        }))
      } catch (error) {
        console.error('Error guardando push token:', error)
        return handleCORS(NextResponse.json(
          { error: "Error guardando push token" },
          { status: 500 }
        ))
      }
    }

    // GET /api/clientes/pedidos - Obtener pedidos del cliente
    if (route === '/clientes/pedidos' && method === 'GET') {
      const authResult = await verifyClientAuth(request)
      
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        ))
      }

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
    }

    // ============================================
    // CONTACTOS FAVORITOS ENDPOINTS
    // ============================================
    
    // GET /api/contactos-favoritos - Listar contactos favoritos del cliente
    if (route === '/contactos-favoritos' && method === 'GET') {
      try {
        const authResult = await verifyClientAuth(request)
        
        console.log('🔍 GET /contactos-favoritos - Auth result:', {
          authenticated: authResult.authenticated,
          userId: authResult.user?.userId
        })
        
        if (!authResult.authenticated) {
          return handleCORS(NextResponse.json(
            { error: "No autorizado" },
            { status: 401 }
          ))
        }

        const contactos = await prisma.contactoFavorito.findMany({
          where: { clienteId: authResult.user.userId },
          orderBy: { createdAt: 'desc' }
        })
        
        console.log('📋 Contactos encontrados para usuario:', {
          userId: authResult.user.userId,
          cantidad: contactos.length,
          contactos: contactos.map(c => ({ id: c.id, nombre: c.nombre, telefono: c.telefono }))
        })

        // IMPORTANTE: Devolver como objeto con propiedad 'contactos'
        return handleCORS(NextResponse.json({ contactos }))
      } catch (error) {
        console.error('❌ Error obteniendo contactos favoritos:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al obtener contactos favoritos" },
          { status: 500 }
        ))
      }
    }

    // POST /api/contactos-favoritos - Crear nuevo contacto favorito
    if (route === '/contactos-favoritos' && method === 'POST') {
      try {
        const authResult = await verifyClientAuth(request)
        
        if (!authResult.authenticated) {
          return handleCORS(NextResponse.json(
            { error: "No autorizado" },
            { status: 401 }
          ))
        }

        const body = await request.json()
        
        // Validaciones
        if (!body.nombre || !body.telefono || !body.direccion) {
          return handleCORS(NextResponse.json(
            { error: "Nombre, teléfono y dirección son requeridos" },
            { status: 400 }
          ))
        }

        const contacto = await prisma.contactoFavorito.create({
          data: {
            clienteId: authResult.user.userId,
            nombre: body.nombre,
            telefono: body.telefono,
            direccion: body.direccion,
            fecha_especial: body.fecha_especial ? new Date(body.fecha_especial) : null,
            motivo: body.motivo || null
          }
        })

        return handleCORS(NextResponse.json(contacto, { status: 201 }))
      } catch (error) {
        console.error('Error creando contacto favorito:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al crear contacto favorito" },
          { status: 500 }
        ))
      }
    }

    // PUT /api/contactos-favoritos/:id - Actualizar contacto favorito
    const updateContactoMatch = route.match(/^\/contactos-favoritos\/([^\/]+)$/)
    if (updateContactoMatch && method === 'PUT') {
      try {
        const authResult = await verifyClientAuth(request)
        
        if (!authResult.authenticated) {
          return handleCORS(NextResponse.json(
            { error: "No autorizado" },
            { status: 401 }
          ))
        }

        const contactoId = updateContactoMatch[1]
        const body = await request.json()

        // Verificar que el contacto pertenece al cliente
        const contacto = await prisma.contactoFavorito.findUnique({
          where: { id: contactoId }
        })

        if (!contacto) {
          return handleCORS(NextResponse.json(
            { error: "Contacto no encontrado" },
            { status: 404 }
          ))
        }

        if (contacto.clienteId !== authResult.user.userId) {
          return handleCORS(NextResponse.json(
            { error: "No tienes permiso para modificar este contacto" },
            { status: 403 }
          ))
        }

        const contactoActualizado = await prisma.contactoFavorito.update({
          where: { id: contactoId },
          data: {
            nombre: body.nombre,
            telefono: body.telefono,
            direccion: body.direccion,
            fecha_especial: body.fecha_especial ? new Date(body.fecha_especial) : null,
            motivo: body.motivo || null
          }
        })

        return handleCORS(NextResponse.json(contactoActualizado))
      } catch (error) {
        console.error('Error actualizando contacto favorito:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al actualizar contacto favorito" },
          { status: 500 }
        ))
      }
    }

    // DELETE /api/contactos-favoritos/:id - Eliminar contacto favorito
    if (updateContactoMatch && method === 'DELETE') {
      try {
        const authResult = await verifyClientAuth(request)
        
        if (!authResult.authenticated) {
          return handleCORS(NextResponse.json(
            { error: "No autorizado" },
            { status: 401 }
          ))
        }

        const contactoId = updateContactoMatch[1]

        // Verificar que el contacto pertenece al cliente
        const contacto = await prisma.contactoFavorito.findUnique({
          where: { id: contactoId }
        })

        if (!contacto) {
          return handleCORS(NextResponse.json(
            { error: "Contacto no encontrado" },
            { status: 404 }
          ))
        }

        if (contacto.clienteId !== authResult.user.userId) {
          return handleCORS(NextResponse.json(
            { error: "No tienes permiso para eliminar este contacto" },
            { status: 403 }
          ))
        }

        await prisma.contactoFavorito.delete({
          where: { id: contactoId }
        })

        return handleCORS(NextResponse.json({ 
          message: "Contacto eliminado exitosamente" 
        }))
      } catch (error) {
        console.error('Error eliminando contacto favorito:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al eliminar contacto favorito" },
          { status: 500 }
        ))
      }
    }

    // POST /api/contacto/ayuda - Enviar mensaje desde Centro de Ayuda
    if (route === '/contacto/ayuda' && method === 'POST') {
      try {
        const authResult = await verifyClientAuth(request)
        
        if (!authResult.authenticated) {
          return handleCORS(NextResponse.json(
            { error: "No autorizado" },
            { status: 401 }
          ))
        }

        const body = await request.json()
        
        // Validaciones
        if (!body.asunto || !body.mensaje) {
          return handleCORS(NextResponse.json(
            { error: "Asunto y mensaje son requeridos" },
            { status: 400 }
          ))
        }

        // Obtener datos del cliente
        const cliente = await prisma.cliente.findUnique({
          where: { id: authResult.user.userId }
        })

        if (!cliente) {
          return handleCORS(NextResponse.json(
            { error: "Cliente no encontrado" },
            { status: 404 }
          ))
        }

        // Enviar email al admin
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev'
        const ADMIN_EMAIL = process.env.EMAIL_USER || 'blooment222@gmail.com'

        const { data, error } = await resend.emails.send({
          from: `Centro de Ayuda Blooment 🌸 <${SENDER_EMAIL}>`,
          to: [ADMIN_EMAIL],
          subject: `💬 Mensaje de ${cliente.nombre}: ${body.asunto}`,
          replyTo: cliente.email,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; border: 3px solid #F5B6C6; border-radius: 10px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #F5B6C6 0%, #FFD1DC 100%); padding: 25px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 26px;">💬 Nuevo Mensaje del Centro de Ayuda</h1>
              </div>
              
              <div style="padding: 30px;">
                <div style="background-color: #FFF5F7; border-left: 4px solid #F5B6C6; padding: 15px; margin-bottom: 20px;">
                  <h3 style="color: #F5B6C6; margin-top: 0;">Asunto</h3>
                  <p style="font-size: 16px; color: #333; margin: 0;"><strong>${body.asunto}</strong></p>
                </div>
                
                <div style="background-color: white; border: 2px solid #F5B6C6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="color: #F5B6C6; margin-top: 0;">Mensaje</h3>
                  <p style="font-size: 15px; color: #333; line-height: 1.6; white-space: pre-wrap;">${body.mensaje}</p>
                </div>
                
                <div style="background-color: #E3F2FD; border-left: 4px solid #2196F3; padding: 15px; margin-bottom: 20px;">
                  <h3 style="color: #2196F3; margin-top: 0;">Datos del Cliente</h3>
                  <p style="margin: 5px 0;"><strong style="color: #2196F3;">Nombre:</strong> ${cliente.nombre}</p>
                  <p style="margin: 5px 0;"><strong style="color: #2196F3;">Email:</strong> ${cliente.email}</p>
                  <p style="margin: 5px 0;"><strong style="color: #2196F3;">Teléfono:</strong> ${cliente.telefono || 'No proporcionado'}</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #F5F5F5; border-radius: 8px;">
                  <p style="color: #666; font-size: 14px; margin: 0;">
                    Puedes responder directamente a este email. Tu respuesta llegará a: <strong>${cliente.email}</strong>
                  </p>
                </div>
              </div>
            </div>
          `
        })

        if (error) {
          console.error('❌ Error de Resend al enviar mensaje de ayuda:', error)
          return handleCORS(NextResponse.json(
            { error: "Error al enviar mensaje" },
            { status: 500 }
          ))
        }

        console.log(`✅ Mensaje de ayuda enviado al admin desde ${cliente.email}. ID:`, data.id)

        return handleCORS(NextResponse.json({
          success: true,
          message: "Mensaje enviado exitosamente. Te responderemos pronto.",
          messageId: data.id
        }))

      } catch (error) {
        console.error('❌ Error en endpoint de ayuda:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al procesar tu mensaje" },
          { status: 500 }
        ))
      }
    }

    // ============================================
    // USUARIOS ENDPOINTS
    // ============================================
    
    // GET /api/usuarios - Listar todos los usuarios
    if (route === '/usuarios' && method === 'GET') {
      const usuarios = await prisma.usuario.findMany({
        orderBy: { createdAt: 'desc' }
      })
      return handleCORS(NextResponse.json(usuarios))
    }

    // GET /api/usuarios/:id - Obtener un usuario por ID
    const usuarioDetailMatch = route.match(/^\/usuarios\/([^\/]+)$/)
    if (usuarioDetailMatch && method === 'GET') {
      const id = usuarioDetailMatch[1]
      const usuario = await prisma.usuario.findUnique({
        where: { id },
        include: {
          pedidos: true,
          pagos: true
        }
      })
      
      if (!usuario) {
        return handleCORS(NextResponse.json(
          { error: "Usuario no encontrado" }, 
          { status: 404 }
        ))
      }
      
      return handleCORS(NextResponse.json(usuario))
    }

    // POST /api/usuarios - Crear un nuevo usuario
    if (route === '/usuarios' && method === 'POST') {
      const body = await request.json()
      
      // Validaciones
      if (!body.nombre || !body.email) {
        return handleCORS(NextResponse.json(
          { error: "nombre y email son requeridos" }, 
          { status: 400 }
        ))
      }

      const usuario = await prisma.usuario.create({
        data: {
          nombre: body.nombre,
          email: body.email,
          telefono: body.telefono || null,
          direccion: body.direccion || null
        }
      })
      
      return handleCORS(NextResponse.json(usuario, { status: 201 }))
    }

    // PUT /api/usuarios/:id - Actualizar un usuario
    if (usuarioDetailMatch && method === 'PUT') {
      const id = usuarioDetailMatch[1]
      const body = await request.json()
      
      const usuario = await prisma.usuario.update({
        where: { id },
        data: {
          nombre: body.nombre,
          email: body.email,
          telefono: body.telefono,
          direccion: body.direccion
        }
      })
      
      return handleCORS(NextResponse.json(usuario))
    }

    // DELETE /api/usuarios/:id - Eliminar un usuario
    if (usuarioDetailMatch && method === 'DELETE') {
      const id = usuarioDetailMatch[1]
      
      await prisma.usuario.delete({
        where: { id }
      })
      
      return handleCORS(NextResponse.json({ 
        message: "Usuario eliminado correctamente" 
      }))
    }

    // ============================================
    // PRODUCTOS ENDPOINTS
    // ============================================
    
    // GET /api/productos - Listar todos los productos
    if (route === '/productos' && method === 'GET') {
      try {
        // Query con todos los campos disponibles - OPTIMIZADO con límite
        const productos = await prisma.$queryRaw`
          SELECT 
            id, 
            nombre, 
            descripcion, 
            medidas,
            flores_incluidas,
            precio, 
            stock, 
            imagen_url,
            categoria,
            tipo_flor,
            ocasion,
            en_oferta,
            precio_oferta,
            porcentaje_descuento,
            fecha_inicio_oferta,
            fecha_fin_oferta,
            "createdAt", 
            "updatedAt"
          FROM productos 
          ORDER BY "createdAt" DESC
          LIMIT 200
        `
        
        // Convertir BigInt a Number para JSON
        const productosSerializable = productos.map(p => ({
          ...p,
          precio: Number(p.precio),
          stock: Number(p.stock),
          precio_oferta: p.precio_oferta ? Number(p.precio_oferta) : null
        }))
        
        return handleCORS(NextResponse.json(productosSerializable))
      } catch (error) {
        console.error('Error obteniendo productos:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al cargar productos", details: error.message },
          { status: 500 }
        ))
      }
    }

    // GET /api/productos/:id - Obtener un producto por ID
    const productoDetailMatch = route.match(/^\/productos\/([^\/]+)$/)
    if (productoDetailMatch && method === 'GET') {
      const id = productoDetailMatch[1]
      const producto = await prisma.producto.findUnique({
        where: { id }
      })
      
      if (!producto) {
        return handleCORS(NextResponse.json(
          { error: "Producto no encontrado" }, 
          { status: 404 }
        ))
      }
      
      return handleCORS(NextResponse.json(producto))
    }

    // POST /api/productos - Crear un nuevo producto (PROTEGIDO)
    if (route === '/productos' && method === 'POST') {
      // Verificar autenticación
      const authResult = await verifyAuth(request)
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado. Debes iniciar sesión" },
          { status: 401 }
        ))
      }

      const body = await request.json()
      
      // Validaciones
      if (!body.nombre || body.precio === undefined) {
        return handleCORS(NextResponse.json(
          { error: "nombre y precio son requeridos" }, 
          { status: 400 }
        ))
      }

      try {
        // Preparar datos base
        const data = {
          nombre: body.nombre,
          descripcion: body.descripcion || null,
          precio: parseFloat(body.precio),
          stock: body.stock !== undefined ? parseInt(body.stock) : 0,
          imagen_url: body.imagen_url || null
        }

        // Intentar agregar campos nuevos solo si existen en el schema
        if (body.medidas !== undefined) data.medidas = body.medidas || null
        if (body.flores_incluidas !== undefined) data.flores_incluidas = body.flores_incluidas || null
        if (body.categoria !== undefined) data.categoria = body.categoria || null
        if (body.tipo_flor !== undefined) data.tipo_flor = body.tipo_flor || null
        if (body.ocasion !== undefined) data.ocasion = body.ocasion || null
        if (body.en_oferta !== undefined) data.en_oferta = Boolean(body.en_oferta)
        if (body.precio_oferta !== undefined) data.precio_oferta = body.precio_oferta ? parseFloat(body.precio_oferta) : null
        if (body.porcentaje_descuento !== undefined) data.porcentaje_descuento = body.porcentaje_descuento ? parseInt(body.porcentaje_descuento) : null
        if (body.fecha_inicio_oferta) data.fecha_inicio_oferta = new Date(body.fecha_inicio_oferta)
        if (body.fecha_fin_oferta) data.fecha_fin_oferta = new Date(body.fecha_fin_oferta)

        const producto = await prisma.producto.create({ data })
        
        return handleCORS(NextResponse.json(producto, { status: 201 }))
      } catch (error) {
        // Si falla por campos no existentes, intentar crear solo con campos base
        console.error('Error creando producto con campos completos:', error.message)
        
        const producto = await prisma.producto.create({
          data: {
            nombre: body.nombre,
            descripcion: body.descripcion || null,
            precio: parseFloat(body.precio),
            stock: body.stock !== undefined ? parseInt(body.stock) : 0,
            imagen_url: body.imagen_url || null
          }
        })
        
        return handleCORS(NextResponse.json(producto, { status: 201 }))
      }
    }

    // PUT /api/productos/:id - Actualizar un producto (PROTEGIDO)
    if (productoDetailMatch && method === 'PUT') {
      // Verificar autenticación
      const authResult = await verifyAuth(request)
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado. Debes iniciar sesión" },
          { status: 401 }
        ))
      }

      const id = productoDetailMatch[1]
      const body = await request.json()
      
      const producto = await prisma.producto.update({
        where: { id },
        data: {
          nombre: body.nombre,
          descripcion: body.descripcion,
          medidas: body.medidas,
          flores_incluidas: body.flores_incluidas,
          precio: body.precio !== undefined ? parseFloat(body.precio) : undefined,
          stock: body.stock !== undefined ? parseInt(body.stock) : undefined,
          imagen_url: body.imagen_url
        }
      })
      
      return handleCORS(NextResponse.json(producto))
    }

    // DELETE /api/productos/:id - Eliminar un producto (PROTEGIDO)
    if (productoDetailMatch && method === 'DELETE') {
      // Verificar autenticación
      const authResult = await verifyAuth(request)
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado. Debes iniciar sesión" },
          { status: 401 }
        ))
      }

      const id = productoDetailMatch[1]
      
      await prisma.producto.delete({
        where: { id }
      })
      
      return handleCORS(NextResponse.json({ 
        message: "Producto eliminado correctamente" 
      }))
    }

    // ============================================
    // PEDIDOS ENDPOINTS
    // ============================================
    
    // GET /api/pedidos - Listar todos los pedidos (OPTIMIZADO con paginación)
    if (route === '/pedidos' && method === 'GET') {
      const pedidos = await prisma.pedido.findMany({
        take: 100, // Límite de 100 pedidos por request
        include: {
          usuario: true,
          detallesPedido: {
            include: {
              producto: true
            }
          },
          pagos: true
        },
        orderBy: { fecha: 'desc' }
      })
      return handleCORS(NextResponse.json(pedidos))
    }

    // GET /api/pedidos/admin/todos - Obtener todos los pedidos para admin
    if (route === '/pedidos/admin/todos' && method === 'GET') {
      try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
          return handleCORS(NextResponse.json(
            { error: "Token no proporcionado" },
            { status: 401 }
          ))
        }

        const token = authHeader.replace('Bearer ', '')
        const decoded = verifyAuth(token)
        
        if (!decoded) {
          return handleCORS(NextResponse.json(
            { error: "Token inválido" },
            { status: 401 }
          ))
        }

        // OPTIMIZADO: Paginación en pedidos de admin
        const pedidos = await prisma.pedido.findMany({
          take: 150, // Límite de 150 pedidos para admin
          include: {
            cliente: {
              select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true
              }
            },
            detallesPedido: {
              include: {
                producto: {
                  select: {
                    id: true,
                    nombre: true,
                    precio: true,
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
        console.error('Error obteniendo pedidos admin:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al obtener pedidos" },
          { status: 500 }
        ))
      }
    }
    
    // GET /api/pedidos/cliente/mis-pedidos - Obtener pedidos del cliente autenticado
    if (route === '/pedidos/cliente/mis-pedidos' && method === 'GET') {
      try {
        const authResult = await verifyClientAuth(request)
        
        if (!authResult.authenticated) {
          return handleCORS(NextResponse.json(
            { error: authResult.error || "No autenticado" },
            { status: 401 }
          ))
        }

        const pedidos = await prisma.pedido.findMany({
          where: {
            clienteId: authResult.user.userId
          },
          include: {
            detallesPedido: {
              include: {
                producto: {
                  select: {
                    id: true,
                    nombre: true,
                    precio: true,
                    imagen_url: true,
                    categoria: true
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
    
    // PUT /api/pedidos/admin/:id/estado - Actualizar estado de un pedido (solo admin)
    const adminEstadoMatch = route.match(/^\/pedidos\/admin\/([^\/]+)\/estado$/)
    if (adminEstadoMatch && method === 'PUT') {
      try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
          return handleCORS(NextResponse.json(
            { error: "Token no proporcionado" },
            { status: 401 }
          ))
        }

        const token = authHeader.replace('Bearer ', '')
        const decoded = verifyAuth(token)
        
        if (!decoded) {
          return handleCORS(NextResponse.json(
            { error: "Token inválido" },
            { status: 401 }
          ))
        }

        const id = adminEstadoMatch[1]
        const body = await request.json()
        
        if (!body.estado) {
          return handleCORS(NextResponse.json(
            { error: "Estado es requerido" },
            { status: 400 }
          ))
        }

        const pedido = await prisma.pedido.update({
          where: { id },
          data: {
            estado: body.estado
          },
          include: {
            cliente: {
              select: {
                nombre: true,
                email: true,
                telefono: true
              }
            },
            detallesPedido: {
              include: {
                producto: true
              }
            }
          }
        })
        
        // 🔔 ENVIAR NOTIFICACIÓN AL CLIENTE cuando cambia el estado
        try {
          const { enviarNotificacionCliente } = await import('@/lib/email')
          await enviarNotificacionCliente(pedido, pedido.cliente, body.estado)
          console.log(`✅ Notificación por email enviada al cliente para estado: ${body.estado}`)
        } catch (emailError) {
          console.error('⚠️ Error enviando notificación por email (no crítico):', emailError)
          // No bloqueamos la respuesta si falla el email
        }

        // 🔔 ENVIAR NOTIFICACIÓN PUSH cuando cambia el estado
        setImmediate(async () => {
          try {
            const oneSignalService = (await import('@/lib/onesignal-service')).default
            
            // Obtener el push_token del cliente
            const clienteWithPush = await prisma.cliente.findUnique({
              where: { id: pedido.clienteId },
              select: { push_token: true, push_enabled: true }
            })

            if (clienteWithPush?.push_enabled && clienteWithPush?.push_token) {
              const result = await oneSignalService.notifyOrderStatusChange(
                clienteWithPush.push_token,
                body.estado,
                pedido.id
              )
              
              if (result.success) {
                console.log(`✅ Notificación push enviada al cliente para estado: ${body.estado}`)
              } else {
                console.log(`⚠️ No se pudo enviar push para estado ${body.estado}:`, result.error)
              }
            } else {
              console.log(`ℹ️ Cliente no tiene notificaciones push activadas`)
            }
          } catch (pushError) {
            console.error('⚠️ Error enviando notificación push (no crítico):', pushError)
          }
        })

        // 📱 ENVIAR NOTIFICACIÓN POR WHATSAPP
        setImmediate(async () => {
          try {
            const resultadoWhatsApp = await actualizarEstadoPedidoWhatsApp(pedido, body.estado)
            if (resultadoWhatsApp.success) {
              console.log(`✅ Notificación por WhatsApp enviada al cliente para estado: ${body.estado}`)
            } else {
              console.log(`⚠️ No se pudo enviar WhatsApp para estado ${body.estado}:`, resultadoWhatsApp.error)
            }
          } catch (whatsappError) {
            console.error('⚠️ Error enviando notificación por WhatsApp (no crítico):', whatsappError)
          }
        })
        
        return handleCORS(NextResponse.json(pedido))
      } catch (error) {
        console.error('Error actualizando estado:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al actualizar estado del pedido" },
          { status: 500 }
        ))
      }
    }


    // PUT /api/pedidos/cliente/:id/actualizar - Actualizar detalles del pedido (solo si estado permite)
    const updatePedidoMatch = route.match(/^\/pedidos\/cliente\/([^\/]+)\/actualizar$/)
    if (updatePedidoMatch && method === 'PUT') {
      try {
        const authResult = await verifyClientAuth(request)
        
        console.log('🔐 Resultado de autenticación:', {
          authenticated: authResult.authenticated,
          user: authResult.user,
          userId: authResult.user?.userId
        })
        
        if (!authResult.authenticated) {
          return handleCORS(NextResponse.json(
            { error: "No autenticado" },
            { status: 401 }
          ))
        }
        
        // Obtener userId de forma segura - USAR authResult.user.userId
        const userId = authResult.user?.userId
        
        if (!userId) {
          console.error('❌ No se pudo obtener userId:', authResult)
          return handleCORS(NextResponse.json(
            { error: "Usuario no identificado. Por favor inicia sesión nuevamente." },
            { status: 401 }
          ))
        }

        const pedidoId = updatePedidoMatch[1]
        const body = await request.json()
        
        console.log('📝 Datos recibidos para actualizar:', {
          pedidoId,
          userId,
          datos: body
        })
        
        // Verificar que el pedido existe y pertenece al cliente
        const pedido = await prisma.pedido.findFirst({
          where: {
            id: pedidoId,
            clienteId: userId
          }
        })
        
        if (!pedido) {
          return handleCORS(NextResponse.json(
            { error: "Pedido no encontrado" },
            { status: 404 }
          ))
        }
        
        // Solo permitir editar si el estado es pendiente o en_preparacion
        if (pedido.estado !== 'pendiente' && pedido.estado !== 'en_preparacion') {
          return handleCORS(NextResponse.json(
            { error: "Este pedido ya no puede ser modificado" },
            { status: 403 }
          ))
        }
        
        // Actualizar solo los campos permitidos
        const pedidoActualizado = await prisma.pedido.update({
          where: { id: pedidoId },
          data: {
            nombre_destinatario: body.nombre_destinatario || pedido.nombre_destinatario,
            tel_destinatario: body.tel_destinatario || pedido.tel_destinatario,
            horario_entrega: body.horario_entrega || pedido.horario_entrega,
            dedicatoria: body.dedicatoria !== undefined ? body.dedicatoria : pedido.dedicatoria
          },
          include: {
            detallesPedido: {
              include: {
                producto: true
              }
            }
          }
        })
        
        console.log('✅ Pedido actualizado en la base de datos:', pedidoActualizado.id)
        
        // Enviar notificación al administrador si se solicita
        if (body.notificar_admin && body.cambios) {
          console.log('📧 Intentando enviar email de notificación...')
          
          // Ejecutar envío de email sin bloquear la respuesta
          setImmediate(async () => {
            try {
              // Verificar API Key
              if (!process.env.RESEND_API_KEY) {
                console.error('❌ RESEND_API_KEY no está configurada en el entorno')
                return
              }
              
              console.log('🔑 RESEND_API_KEY encontrada:', process.env.RESEND_API_KEY.substring(0, 10) + '...')
              
              const { Resend } = require('resend')
              const resend = new Resend(process.env.RESEND_API_KEY)
              
              // Construir lista de cambios
              let cambiosHTML = '<ul>'
              const cambios = body.cambios.cambiosRealizados
              
              console.log('📝 Procesando cambios:', cambios)
              
              if (cambios.nombre_destinatario && cambios.nombre_destinatario.anterior !== cambios.nombre_destinatario.nuevo) {
                cambiosHTML += `<li><strong>Nombre destinatario:</strong> ${cambios.nombre_destinatario.anterior || 'N/A'} → ${cambios.nombre_destinatario.nuevo}</li>`
              }
              if (cambios.tel_destinatario && cambios.tel_destinatario.anterior !== cambios.tel_destinatario.nuevo) {
                const cambioTelefono = cambios.tel_destinatario.anterior !== cambios.tel_destinatario.nuevo ? 'Sí' : 'No'
                cambiosHTML += `<li><strong>¿Cambió teléfono?:</strong> ${cambioTelefono}</li>`
                if (cambioTelefono === 'Sí') {
                  cambiosHTML += `<li><strong>Nuevo teléfono destinatario:</strong> ${cambios.tel_destinatario.nuevo}</li>`
                }
              }
              if (cambios.horario_entrega && cambios.horario_entrega.anterior !== cambios.horario_entrega.nuevo) {
                cambiosHTML += `<li><strong>Nuevo horario de entrega:</strong> ${cambios.horario_entrega.nuevo}</li>`
              }
              if (cambios.dedicatoria && cambios.dedicatoria.anterior !== cambios.dedicatoria.nuevo) {
                cambiosHTML += `<li><strong>Dedicatoria:</strong> Modificada</li>`
              }
              cambiosHTML += '</ul>'
              
              console.log('📨 Enviando email a blooment222@gmail.com...')
              
              const result = await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: 'blooment222@gmail.com',
                subject: `🔔 Pedido #${pedido.id.slice(0, 8).toUpperCase()} - Cambios Realizados`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #F5B6C6;">🌸 Cambios en Pedido</h2>
                    <p>El cliente <strong>${pedido.nombre_cliente}</strong> ha modificado su pedido:</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
                      <p><strong>Pedido ID:</strong> ${pedido.id}</p>
                      <p><strong>Cliente:</strong> ${pedido.nombre_cliente}</p>
                      <p><strong>Email:</strong> ${pedido.email_cliente}</p>
                      <p><strong>Teléfono Cliente:</strong> ${pedido.telefono_cliente}</p>
                    </div>
                    
                    <h3 style="color: #F5B6C6;">Cambios realizados:</h3>
                    ${cambiosHTML}
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
                      <p><strong>⚠️ Importante:</strong> Revisa estos cambios y ajusta la logística de entrega si es necesario.</p>
                    </div>
                    
                    <p style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
                      Este email se generó automáticamente desde el sistema de Blooment.<br>
                      Fecha: ${new Date().toLocaleString('es-MX')}
                    </p>
                  </div>
                `
              })
              
              console.log('✅ Email de notificación enviado exitosamente:', result)
            } catch (emailError) {
              console.error('❌ Error enviando email al admin:', {
                mensaje: emailError.message,
                error: emailError
              })
            }
          })
        } else {
          console.log('ℹ️ No se solicitó notificación al admin o no hay cambios')
        }
        
        // Retornar respuesta exitosa INMEDIATAMENTE (sin esperar el email)
        return handleCORS(NextResponse.json({
          message: "Pedido actualizado exitosamente",
          pedido: pedidoActualizado
        }))
        
      } catch (error) {
        console.error('❌ Error actualizando pedido:', {
          mensaje: error.message,
          stack: error.stack,
          pedidoId: updatePedidoMatch[1]
        })
        return handleCORS(NextResponse.json(
          { error: "Error al actualizar pedido: " + error.message },
          { status: 500 }
        ))
      }
    }

    // PUT /api/pedidos/:id/cancelar - Cancelar pedido (solo cliente, solo en estado "pendiente")
    const cancelarPedidoMatch = route.match(/^\/pedidos\/([^\/]+)\/cancelar$/)
    if (cancelarPedidoMatch && method === 'PUT') {
      try {
        const authResult = await verifyClientAuth(request)
        
        console.log('🔐 Auth result para cancelación:', authResult)
        
        if (!authResult.authenticated) {
          console.error('❌ Cliente no autenticado para cancelar pedido:', authResult.error)
          return handleCORS(NextResponse.json(
            { error: "No autorizado: " + authResult.error },
            { status: 401 }
          ))
        }

        const pedidoId = cancelarPedidoMatch[1]
        console.log(`🔄 Intentando cancelar pedido ${pedidoId} por cliente ${authResult.user.userId}`)

        // Verificar que el pedido existe y pertenece al cliente
        const pedido = await prisma.pedido.findUnique({
          where: { id: pedidoId }
        })

        if (!pedido) {
          return handleCORS(NextResponse.json(
            { error: "Pedido no encontrado" },
            { status: 404 }
          ))
        }

        if (pedido.clienteId !== authResult.user.userId) {
          return handleCORS(NextResponse.json(
            { error: "No tienes permiso para cancelar este pedido" },
            { status: 403 }
          ))
        }

        // Solo permitir cancelación en estado "pendiente"
        if (pedido.estado !== 'pendiente') {
          return handleCORS(NextResponse.json(
            { error: "Este pedido ya no puede ser cancelado" },
            { status: 400 }
          ))
        }

        console.log(`✅ Cancelando pedido ${pedidoId}`)

        // Actualizar estado a cancelado
        const pedidoCancelado = await prisma.pedido.update({
          where: { id: pedidoId },
          data: {
            estado: 'cancelado'
          }
        })

        console.log('✅ Pedido cancelado exitosamente')

        return handleCORS(NextResponse.json({
          message: "Pedido cancelado exitosamente",
          pedido: pedidoCancelado
        }))
      } catch (error) {
        console.error('❌ Error cancelando pedido:', {
          message: error.message,
          stack: error.stack
        })
        return handleCORS(NextResponse.json(
          { error: "Error al cancelar el pedido: " + error.message },
          { status: 500 }
        ))
      }
    }

    // DELETE /api/pedidos/:id - Eliminar pedido (solo cliente, solo pedidos cancelados)
    const eliminarPedidoMatch = route.match(/^\/pedidos\/([^\/]+)$/)
    if (eliminarPedidoMatch && method === 'DELETE') {
      try {
        const authResult = await verifyClientAuth(request)
        
        console.log('🔐 Auth result para eliminación:', authResult)
        
        if (!authResult.authenticated) {
          console.error('❌ Cliente no autenticado para eliminar pedido:', authResult.error)
          return handleCORS(NextResponse.json(
            { error: "No autorizado: " + authResult.error },
            { status: 401 }
          ))
        }

        const pedidoId = eliminarPedidoMatch[1]
        console.log(`🗑️ Intentando eliminar pedido ${pedidoId} por cliente ${authResult.user.userId}`)

        // Verificar que el pedido existe y pertenece al cliente
        const pedido = await prisma.pedido.findUnique({
          where: { id: pedidoId }
        })

        if (!pedido) {
          return handleCORS(NextResponse.json(
            { error: "Pedido no encontrado" },
            { status: 404 }
          ))
        }

        if (pedido.clienteId !== authResult.user.userId) {
          return handleCORS(NextResponse.json(
            { error: "No tienes permiso para eliminar este pedido" },
            { status: 403 }
          ))
        }

        // Solo permitir eliminación de pedidos cancelados
        if (pedido.estado !== 'cancelado') {
          return handleCORS(NextResponse.json(
            { error: "Solo puedes eliminar pedidos cancelados" },
            { status: 400 }
          ))
        }

        console.log(`✅ Eliminando pedido ${pedidoId}`)

        // Eliminar el pedido (cascade delete se encargará de los detalles)
        await prisma.pedido.delete({
          where: { id: pedidoId }
        })

        console.log('✅ Pedido eliminado exitosamente')

        return handleCORS(NextResponse.json({
          message: "Pedido eliminado exitosamente"
        }))
      } catch (error) {
        console.error('❌ Error eliminando pedido:', {
          message: error.message,
          stack: error.stack
        })
        return handleCORS(NextResponse.json(
          { error: "Error al eliminar el pedido: " + error.message },
          { status: 500 }
        ))
      }
    }

    // GET /api/pedidos/:id - Obtener un pedido por ID
    const pedidoDetailMatch = route.match(/^\/pedidos\/([^\/]+)$/)
    if (pedidoDetailMatch && method === 'GET') {
      const id = pedidoDetailMatch[1]
      const pedido = await prisma.pedido.findUnique({
        where: { id },
        include: {
          usuario: true,
          detallesPedido: {
            include: {
              producto: true
            }
          },
          pagos: true
        }
      })
      
      if (!pedido) {
        return handleCORS(NextResponse.json(
          { error: "Pedido no encontrado" }, 
          { status: 404 }
        ))
      }
      
      return handleCORS(NextResponse.json(pedido))
    }

    // POST /api/pedidos - Crear un nuevo pedido
    if (route === '/pedidos' && method === 'POST') {
      const body = await request.json()
      
      // Validaciones
      if (!body.usuarioId || !body.detalles || body.detalles.length === 0) {
        return handleCORS(NextResponse.json(
          { error: "usuarioId y detalles son requeridos" }, 
          { status: 400 }
        ))
      }

      // Calcular total
      let total = 0
      for (const detalle of body.detalles) {
        total += detalle.cantidad * detalle.precio_unitario
      }

      // Crear pedido con detalles en una transacción
      const pedido = await prisma.pedido.create({
        data: {
          usuarioId: body.usuarioId,
          total: body.total || total,
          estado: body.estado || 'pendiente',
          fecha: body.fecha ? new Date(body.fecha) : new Date(),
          detallesPedido: {
            create: body.detalles.map(detalle => ({
              productoId: detalle.productoId,
              cantidad: detalle.cantidad,
              precio_unitario: parseFloat(detalle.precio_unitario),
              subtotal: detalle.cantidad * parseFloat(detalle.precio_unitario)
            }))
          }
        },
        include: {
          detallesPedido: {
            include: {
              producto: true
            }
          },
          usuario: true
        }
      })
      
      return handleCORS(NextResponse.json(pedido, { status: 201 }))
    }

    // PUT /api/pedidos/:id - Actualizar un pedido
    if (pedidoDetailMatch && method === 'PUT') {
      const id = pedidoDetailMatch[1]
      const body = await request.json()
      
      const pedido = await prisma.pedido.update({
        where: { id },
        data: {
          total: body.total !== undefined ? parseFloat(body.total) : undefined,
          estado: body.estado,
          fecha: body.fecha ? new Date(body.fecha) : undefined
        },
        include: {
          detallesPedido: {
            include: {
              producto: true
            }
          },
          usuario: true,
          pagos: true
        }
      })
      
      return handleCORS(NextResponse.json(pedido))
    }

    // DELETE /api/pedidos/:id - Eliminar un pedido
    if (pedidoDetailMatch && method === 'DELETE') {
      const id = pedidoDetailMatch[1]
      
      await prisma.pedido.delete({
        where: { id }
      })
      
      return handleCORS(NextResponse.json({ 
        message: "Pedido eliminado correctamente" 
      }))
    }

    // ============================================
    // DETALLES PEDIDO ENDPOINTS
    // ============================================
    
    // GET /api/detalles-pedido - Listar todos los detalles
    if (route === '/detalles-pedido' && method === 'GET') {
      const detalles = await prisma.detallePedido.findMany({
        include: {
          pedido: true,
          producto: true
        },
        orderBy: { createdAt: 'desc' }
      })
      return handleCORS(NextResponse.json(detalles))
    }

    // GET /api/detalles-pedido/:id - Obtener un detalle por ID
    const detalleDetailMatch = route.match(/^\/detalles-pedido\/([^\/]+)$/)
    if (detalleDetailMatch && method === 'GET') {
      const id = detalleDetailMatch[1]
      const detalle = await prisma.detallePedido.findUnique({
        where: { id },
        include: {
          pedido: true,
          producto: true
        }
      })
      
      if (!detalle) {
        return handleCORS(NextResponse.json(
          { error: "Detalle no encontrado" }, 
          { status: 404 }
        ))
      }
      
      return handleCORS(NextResponse.json(detalle))
    }

    // POST /api/detalles-pedido - Crear un nuevo detalle
    if (route === '/detalles-pedido' && method === 'POST') {
      const body = await request.json()
      
      // Validaciones
      if (!body.pedidoId || !body.productoId || !body.cantidad || !body.precio_unitario) {
        return handleCORS(NextResponse.json(
          { error: "pedidoId, productoId, cantidad y precio_unitario son requeridos" }, 
          { status: 400 }
        ))
      }

      const subtotal = body.cantidad * body.precio_unitario

      const detalle = await prisma.detallePedido.create({
        data: {
          pedidoId: body.pedidoId,
          productoId: body.productoId,
          cantidad: parseInt(body.cantidad),
          precio_unitario: parseFloat(body.precio_unitario),
          subtotal: subtotal
        },
        include: {
          pedido: true,
          producto: true
        }
      })
      
      return handleCORS(NextResponse.json(detalle, { status: 201 }))
    }

    // PUT /api/detalles-pedido/:id - Actualizar un detalle
    if (detalleDetailMatch && method === 'PUT') {
      const id = detalleDetailMatch[1]
      const body = await request.json()
      
      const cantidad = body.cantidad !== undefined ? parseInt(body.cantidad) : undefined
      const precio_unitario = body.precio_unitario !== undefined ? parseFloat(body.precio_unitario) : undefined
      let subtotal = undefined
      
      if (cantidad !== undefined && precio_unitario !== undefined) {
        subtotal = cantidad * precio_unitario
      }

      const detalle = await prisma.detallePedido.update({
        where: { id },
        data: {
          cantidad,
          precio_unitario,
          subtotal
        },
        include: {
          pedido: true,
          producto: true
        }
      })
      
      return handleCORS(NextResponse.json(detalle))
    }

    // DELETE /api/detalles-pedido/:id - Eliminar un detalle
    if (detalleDetailMatch && method === 'DELETE') {
      const id = detalleDetailMatch[1]
      
      await prisma.detallePedido.delete({
        where: { id }
      })
      
      return handleCORS(NextResponse.json({ 
        message: "Detalle eliminado correctamente" 
      }))
    }

    // ============================================
    // PAGOS ENDPOINTS
    // ============================================
    
    // GET /api/pagos - Listar todos los pagos
    if (route === '/pagos' && method === 'GET') {
      const pagos = await prisma.pago.findMany({
        include: {
          pedido: true,
          usuario: true
        },
        orderBy: { createdAt: 'desc' }
      })
      return handleCORS(NextResponse.json(pagos))
    }

    // GET /api/pagos/:id - Obtener un pago por ID
    const pagoDetailMatch = route.match(/^\/pagos\/([^\/]+)$/)
    if (pagoDetailMatch && method === 'GET') {
      const id = pagoDetailMatch[1]
      const pago = await prisma.pago.findUnique({
        where: { id },
        include: {
          pedido: true,
          usuario: true
        }
      })
      
      if (!pago) {
        return handleCORS(NextResponse.json(
          { error: "Pago no encontrado" }, 
          { status: 404 }
        ))
      }
      
      return handleCORS(NextResponse.json(pago))
    }

    // POST /api/pagos - Crear un nuevo pago
    if (route === '/pagos' && method === 'POST') {
      const body = await request.json()
      
      // Validaciones
      if (!body.pedidoId || !body.usuarioId || !body.monto || !body.metodo) {
        return handleCORS(NextResponse.json(
          { error: "pedidoId, usuarioId, monto y metodo son requeridos" }, 
          { status: 400 }
        ))
      }

      const pago = await prisma.pago.create({
        data: {
          pedidoId: body.pedidoId,
          usuarioId: body.usuarioId,
          monto: parseFloat(body.monto),
          metodo: body.metodo,
          estado: body.estado || 'pendiente',
          referencia_externa: body.referencia_externa || null
        },
        include: {
          pedido: true,
          usuario: true
        }
      })
      
      return handleCORS(NextResponse.json(pago, { status: 201 }))
    }

    // PUT /api/pagos/:id - Actualizar un pago
    if (pagoDetailMatch && method === 'PUT') {
      const id = pagoDetailMatch[1]
      const body = await request.json()
      
      const pago = await prisma.pago.update({
        where: { id },
        data: {
          monto: body.monto !== undefined ? parseFloat(body.monto) : undefined,
          metodo: body.metodo,
          estado: body.estado,
          referencia_externa: body.referencia_externa
        },
        include: {
          pedido: true,
          usuario: true
        }
      })
      
      return handleCORS(NextResponse.json(pago))
    }

    // DELETE /api/pagos/:id - Eliminar un pago
    if (pagoDetailMatch && method === 'DELETE') {
      const id = pagoDetailMatch[1]
      
      await prisma.pago.delete({
        where: { id }
      })
      
      return handleCORS(NextResponse.json({ 
        message: "Pago eliminado correctamente" 
      }))
    }

    // ============================================
    // STRIPE CHECKOUT ENDPOINTS
    // ============================================

    // POST /api/checkout - Crear sesión de checkout de Stripe
    if (route === '/checkout' && method === 'POST') {
      // Verificar autenticación
      const authResult = await verifyClientAuth(request)
      
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "Debes iniciar sesión para realizar una compra" },
          { status: 401 }
        ))
      }

      try {
        const body = await request.json()
        const { items, origin, detallesEntrega } = body

        if (!items || items.length === 0) {
          return handleCORS(NextResponse.json(
            { error: "El carrito está vacío" },
            { status: 400 }
          ))
        }

        if (!origin) {
          return handleCORS(NextResponse.json(
            { error: "Origin URL es requerida" },
            { status: 400 }
          ))
        }

        // Obtener datos del cliente
        const cliente = await prisma.cliente.findUnique({
          where: { id: authResult.user.userId }
        })

        if (!cliente) {
          return handleCORS(NextResponse.json(
            { error: "Cliente no encontrado" },
            { status: 404 }
          ))
        }

        // Verificar y obtener productos de la base de datos
        const productosIds = items.map(item => item.id)
        const productos = await prisma.producto.findMany({
          where: { id: { in: productosIds } }
        })

        if (productos.length !== items.length) {
          return handleCORS(NextResponse.json(
            { error: "Algunos productos no están disponibles" },
            { status: 400 }
          ))
        }

        // Calcular total y preparar line_items para Stripe
        let total = 0
        const lineItems = []

        for (const item of items) {
          const producto = productos.find(p => p.id === item.id)
          
          if (!producto) continue
          
          if (producto.stock < item.cantidad) {
            return handleCORS(NextResponse.json(
              { error: `Stock insuficiente para ${producto.nombre}` },
              { status: 400 }
            ))
          }

          const precio = producto.en_oferta && producto.precio_oferta 
            ? producto.precio_oferta 
            : producto.precio

          total += precio * item.cantidad

          const productData = {
            name: producto.nombre,
          }
          
          // Only include description if it exists and is not empty
          if (producto.descripcion && producto.descripcion.trim() !== '') {
            productData.description = producto.descripcion
          }
          
          // Only include images if they exist
          if (producto.imagen_url) {
            productData.images = [producto.imagen_url]
          }

          lineItems.push({
            price_data: {
              currency: 'mxn',
              product_data: productData,
              unit_amount: Math.round(precio * 100) // Stripe usa centavos
            },
            quantity: item.cantidad
          })
        }

        // Inicializar Stripe
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

        // Crear sesión de checkout
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: `${origin}/tienda/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/tienda`,
          customer_email: cliente.email,
          metadata: {
            clienteId: cliente.id,
            items: JSON.stringify(items.map(item => ({
              id: item.id,
              cantidad: item.cantidad
            }))),
            // Detalles de entrega
            nombre_destinatario: detallesEntrega?.nombre_destinatario || '',
            telefono_destinatario: detallesEntrega?.telefono_destinatario || '',
            direccion_entrega: detallesEntrega?.direccion || '',
            horario_entrega: detallesEntrega?.horario_entrega || '',
            dedicatoria: detallesEntrega?.dedicatoria || ''
          }
        })

        return handleCORS(NextResponse.json({
          url: session.url,
          sessionId: session.id
        }))

      } catch (error) {
        console.error('Error creating checkout session:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al crear sesión de pago: " + error.message },
          { status: 500 }
        ))
      }
    }

    // POST /api/checkout/verify-and-create - Verificar sesión y crear pedido si no existe
    if (route === '/checkout/verify-and-create' && method === 'POST') {
      try {
        const authResult = await verifyClientAuth(request)
        
        if (!authResult.authenticated) {
          return handleCORS(NextResponse.json(
            { error: "No autenticado" },
            { status: 401 }
          ))
        }

        const body = await request.json()
        const { sessionId } = body

        if (!sessionId) {
          return handleCORS(NextResponse.json(
            { error: "Session ID es requerido" },
            { status: 400 }
          ))
        }

        // Verificar si ya existe un pedido con este session_id
        const pedidoExistente = await prisma.pedido.findFirst({
          where: { stripe_session_id: sessionId }
        })

        if (pedidoExistente) {
          return handleCORS(NextResponse.json({
            message: "Pedido ya existe",
            pedido: pedidoExistente
          }))
        }

        // Obtener información de la sesión de Stripe
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        const session = await stripe.checkout.sessions.retrieve(sessionId)

        if (session.payment_status !== 'paid') {
          return handleCORS(NextResponse.json(
            { error: "El pago aún no ha sido completado" },
            { status: 400 }
          ))
        }

        // Obtener metadata
        const clienteId = session.metadata.clienteId
        const items = JSON.parse(session.metadata.items)
        
        // Obtener detalles de entrega del metadata (con valores por defecto seguros)
        const detallesEntrega = {
          nombre_destinatario: session.metadata.nombre_destinatario || '',
          tel_destinatario: session.metadata.tel_destinatario || '',
          horario_entrega: session.metadata.horario_entrega || '',
          dedicatoria: session.metadata.dedicatoria || ''
        }
        
        console.log('📦 Detalles de entrega recibidos:', detallesEntrega)

        // Obtener cliente y verificar que existe
        const cliente = await prisma.cliente.findUnique({
          where: { id: clienteId }
        })

        if (!cliente) {
          console.error('Cliente no encontrado:', clienteId)
          return handleCORS(NextResponse.json(
            { error: "Cliente no encontrado" },
            { status: 404 }
          ))
        }

        console.log('✅ Cliente encontrado:', {
          id: cliente.id,
          nombre: cliente.nombre,
          email: cliente.email
        })

        // Crear pedido con transacción
        const pedido = await prisma.$transaction(async (tx) => {
          // Crear el pedido
          // Solo conectar con cliente (usuarioId es opcional y para otro modelo)
          const nuevoPedido = await tx.pedido.create({
            data: {
              // Solo conectar con cliente
              cliente: {
                connect: { id: cliente.id }
              },
              total: session.amount_total / 100, // Convertir de centavos a MXN
              estado: 'pendiente', // Estado inicial del pedido
              nombre_cliente: cliente.nombre,
              email_cliente: cliente.email,
              telefono_cliente: cliente.telefono || '',
              direccion_envio: cliente.direccion || 'No especificada',
              stripe_session_id: session.id,
              // Detalles de entrega y regalo
              nombre_destinatario: detallesEntrega.nombre_destinatario,
              tel_destinatario: detallesEntrega.tel_destinatario,
              horario_entrega: detallesEntrega.horario_entrega,
              dedicatoria: detallesEntrega.dedicatoria
            }
          })

          console.log('✅ Pedido creado:', nuevoPedido.id)

          // Crear detalles del pedido
          for (const item of items) {
            const producto = await tx.producto.findUnique({
              where: { id: item.id }
            })

            if (!producto) continue

            const precio = producto.en_oferta && producto.precio_oferta 
              ? producto.precio_oferta 
              : producto.precio

            await tx.detallePedido.create({
              data: {
                pedidoId: nuevoPedido.id,
                productoId: producto.id,
                cantidad: item.cantidad,
                precio_unitario: precio,
                subtotal: precio * item.cantidad
              }
            })

            // Actualizar stock del producto
            await tx.producto.update({
              where: { id: producto.id },
              data: {
                stock: {
                  decrement: item.cantidad
                }
              }
            })
          }

          return nuevoPedido
        })

        // 🔔 ENVIAR NOTIFICACIONES después de crear el pedido exitosamente
        try {
          const { enviarNotificacionCliente, enviarNotificacionAdmin } = await import('@/lib/email')
          
          // Notificar al cliente que su pedido fue recibido
          await enviarNotificacionCliente(pedido, cliente, 'pendiente')
          console.log('✅ Notificación de confirmación enviada al cliente')
          
          // Notificar al admin que hay un nuevo pedido pagado
          await enviarNotificacionAdmin(pedido, cliente)
          console.log('✅ Notificación de nuevo pedido enviada al admin')
        } catch (emailError) {
          console.error('⚠️ Error enviando notificaciones (no crítico):', emailError)
          // No bloqueamos la respuesta si fallan los emails
        }

        return handleCORS(NextResponse.json({
          message: "Pedido creado exitosamente",
          pedido
        }, { status: 201 }))

    // POST /api/pedidos/test/create-manual - Crear pedido de prueba manual (SOLO PARA DEBUG)
    if (route === '/pedidos/test/create-manual' && method === 'POST') {
      try {
        const authResult = await verifyAuth(request)
        
        if (!authResult.authenticated) {
          return handleCORS(NextResponse.json(
            { error: "Solo admins pueden crear pedidos de prueba" },
            { status: 401 }
          ))
        }

        const body = await request.json()
        const { clienteEmail } = body

        if (!clienteEmail) {
          return handleCORS(NextResponse.json(
            { error: "clienteEmail es requerido" },
            { status: 400 }
          ))
        }

        // Buscar cliente por email
        const cliente = await prisma.cliente.findUnique({
          where: { email: clienteEmail }
        })

        if (!cliente) {
          return handleCORS(NextResponse.json(
            { error: "Cliente no encontrado con ese email" },
            { status: 404 }
          ))
        }

        console.log('🧪 Creando pedido de prueba para:', {
          id: cliente.id,
          nombre: cliente.nombre,
          email: cliente.email
        })

        // Obtener un producto aleatorio
        const producto = await prisma.producto.findFirst()

        if (!producto) {
          return handleCORS(NextResponse.json(
            { error: "No hay productos disponibles" },
            { status: 400 }
          ))
        }

        // Crear pedido de prueba
        const pedido = await prisma.$transaction(async (tx) => {
          const nuevoPedido = await tx.pedido.create({
            data: {
              // SOLO clienteId, NO usuarioId
              clienteId: cliente.id,
              total: producto.precio,
              estado: 'pendiente',
              nombre_cliente: cliente.nombre,
              email_cliente: cliente.email,
              telefono_cliente: cliente.telefono || 'N/A',
              direccion_envio: cliente.direccion || 'Dirección de prueba',
              stripe_session_id: `test_${Date.now()}`
            }
          })

          // Crear detalle del pedido
          await tx.detallePedido.create({
            data: {
              pedidoId: nuevoPedido.id,
              productoId: producto.id,
              cantidad: 1,
              precio_unitario: producto.precio,
              subtotal: producto.precio
            }
          })

          return nuevoPedido
        })

        console.log('✅ Pedido de prueba creado exitosamente:', pedido.id)

        return handleCORS(NextResponse.json({
          message: "Pedido de prueba creado",
          pedido: {
            id: pedido.id,
            clienteId: pedido.clienteId,
            nombre_cliente: pedido.nombre_cliente,
            email_cliente: pedido.email_cliente,
            total: pedido.total,
            estado: pedido.estado
          }
        }, { status: 201 }))

      } catch (error) {
        console.error('❌ Error creando pedido de prueba:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al crear pedido de prueba: " + error.message },
          { status: 500 }
        ))
      }
    }


      } catch (error) {
        console.error('Error verificando y creando pedido:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al procesar pedido: " + error.message },
          { status: 500 }
        ))
      }
    }


    // POST /api/webhooks/stripe - Webhook de Stripe
    if (route === '/webhooks/stripe' && method === 'POST') {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      const sig = request.headers.get('stripe-signature')
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

      try {
        const body = await request.text()
        let event

        if (webhookSecret) {
          // Verificar firma del webhook
          event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
        } else {
          // En desarrollo sin webhook secret
          event = JSON.parse(body)
        }

        // Manejar el evento checkout.session.completed
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object

          // Obtener metadata
          const clienteId = session.metadata.clienteId
          const items = JSON.parse(session.metadata.items)

          // Obtener cliente
          const cliente = await prisma.cliente.findUnique({
            where: { id: clienteId }
          })

          if (!cliente) {
            console.error('Cliente no encontrado en webhook:', clienteId)
            return NextResponse.json({ received: true })
          }

          console.log('✅ Webhook - Cliente encontrado:', {
            id: cliente.id,
            nombre: cliente.nombre,
            email: cliente.email
          })

          // Crear pedido usando sintaxis de relaciones de Prisma
          const pedido = await prisma.pedido.create({
            data: {
              // Conectar relaciones
              usuario: {
                connect: { id: cliente.id }
              },
              cliente: {
                connect: { id: cliente.id }
              },
              total: session.amount_total / 100, // Convertir de centavos a MXN
              estado: 'pendiente', // Estado inicial del pedido
              nombre_cliente: cliente.nombre,
              email_cliente: cliente.email,
              telefono_cliente: cliente.telefono || '',
              direccion_envio: cliente.direccion || 'No especificada',
              stripe_session_id: session.id,
              // Detalles de entrega del metadata de Stripe
              nombre_destinatario: session.metadata.nombre_destinatario || '',
              tel_destinatario: session.metadata.tel_destinatario || '',
              horario_entrega: session.metadata.horario_entrega || '',
              dedicatoria: session.metadata.dedicatoria || ''
            }
          })

          console.log('✅ Webhook - Pedido creado:', pedido.id)

          // Crear detalles del pedido
          for (const item of items) {
            const producto = await prisma.producto.findUnique({
              where: { id: item.id }
            })

            if (!producto) continue

            const precio = producto.en_oferta && producto.precio_oferta 
              ? producto.precio_oferta 
              : producto.precio

            await prisma.detallePedido.create({
              data: {
                pedidoId: pedido.id,
                productoId: producto.id,
                cantidad: item.cantidad,
                precio_unitario: precio,
                subtotal: precio * item.cantidad
              }
            })

            // Actualizar stock
            await prisma.producto.update({
              where: { id: producto.id },
              data: {
                stock: {
                  decrement: item.cantidad
                }
              }
            })
          }

          console.log('✅ Pedido creado exitosamente:', pedido.id)

          // Enviar notificaciones por WhatsApp (no bloqueante)
          setImmediate(async () => {
            try {
              console.log('📱 Enviando notificaciones de WhatsApp...')
              
              // Notificar al admin
              const resultadoAdmin = await notificarNuevoPedidoWhatsApp(pedido)
              if (resultadoAdmin.success) {
                console.log('✅ WhatsApp enviado al admin:', resultadoAdmin.messageId)
              } else {
                console.log('⚠️ No se pudo enviar WhatsApp al admin:', resultadoAdmin.error)
              }

              // Confirmar pedido al cliente
              const resultadoCliente = await confirmarPedidoWhatsApp(pedido)
              if (resultadoCliente.success) {
                console.log('✅ WhatsApp de confirmación enviado al cliente:', resultadoCliente.messageId)
              } else {
                console.log('⚠️ No se pudo enviar WhatsApp al cliente:', resultadoCliente.error)
              }

            } catch (whatsappError) {
              console.error('❌ Error en notificaciones de WhatsApp:', whatsappError)
            }
          })
        }

        return NextResponse.json({ received: true })

      } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json(
          { error: 'Webhook error: ' + error.message },
          { status: 400 }
        )
      }
    }

    // ============================================
    // CUPONES - ADMIN (PROTEGIDO)
    // ============================================
    
    // GET /api/admin/cupones - Listar todos los cupones (PROTEGIDO)
    if (route === '/admin/cupones' && method === 'GET') {
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
    if (route === '/admin/cupones' && method === 'POST') {
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

    // DELETE /api/admin/cupones/:id - Eliminar cupón (PROTEGIDO)
    if (route.startsWith('/admin/cupones/') && method === 'DELETE') {
      const authResult = await verifyAuth(request)
      
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        ))
      }

      try {
        const id = route.split('/').pop()

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

    // ============================================
    // CUPONES - VALIDACIÓN PÚBLICA
    // ============================================
    
    // POST /api/cupones/validar - Validar y aplicar cupón (PÚBLICO)
    if (route === '/cupones/validar' && method === 'POST') {
      const body = await request.json()
      const { codigo, monto_pedido } = body

      if (!codigo) {
        return handleCORS(NextResponse.json(
          { error: "El código del cupón es requerido" },
          { status: 400 }
        ))
      }

      try {
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

    // ============================================
    // CRON JOB - RECORDATORIOS DE FECHAS ESPECIALES
    // ============================================
    
    // GET /api/cron/recordatorios-fechas - Revisar y enviar recordatorios (ejecutado diariamente)
    if (route === '/cron/recordatorios-fechas' && method === 'GET') {
      try {
        const { enviarRecordatorioAdmin, enviarRecordatorioCliente } = await import('@/lib/recordatorios')
        
        // Calcular fecha objetivo: 7 días desde hoy
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        
        const fechaObjetivo = new Date(hoy)
        fechaObjetivo.setDate(fechaObjetivo.getDate() + 7)
        fechaObjetivo.setHours(23, 59, 59, 999)
        
        console.log(`📅 Buscando fechas especiales para: ${fechaObjetivo.toLocaleDateString('es-MX')}`)
        
        // Buscar contactos con fecha especial en 7 días
        const contactosConFechaEspecial = await prisma.contactoFavorito.findMany({
          where: {
            fecha_especial: {
              gte: hoy,
              lte: fechaObjetivo
            }
          },
          include: {
            cliente: true
          }
        })
        
        console.log(`🔔 Encontrados ${contactosConFechaEspecial.length} recordatorios pendientes`)
        
        const resultados = []
        
        for (const contacto of contactosConFechaEspecial) {
          const diasRestantes = Math.ceil((new Date(contacto.fecha_especial) - hoy) / (1000 * 60 * 60 * 24))
          
          console.log(`📧 Procesando recordatorio: ${contacto.motivo} de ${contacto.nombre} (${diasRestantes} días)`)
          
          // Enviar email al admin
          const resultadoAdmin = await enviarRecordatorioAdmin(contacto, contacto.cliente, diasRestantes)
          
          // Enviar email al cliente
          const resultadoCliente = await enviarRecordatorioCliente(contacto, contacto.cliente, diasRestantes)
          
          resultados.push({
            contacto: contacto.nombre,
            motivo: contacto.motivo,
            dias_restantes: diasRestantes,
            email_admin: resultadoAdmin.success,
            email_cliente: resultadoCliente.success
          })
        }
        
        return handleCORS(NextResponse.json({
          success: true,
          fecha_revision: hoy.toISOString(),
          fecha_objetivo: fechaObjetivo.toISOString(),
          total_recordatorios: contactosConFechaEspecial.length,
          resultados
        }))
        
      } catch (error) {
        console.error('❌ Error en cron de recordatorios:', error)
        return handleCORS(NextResponse.json(
          { error: "Error procesando recordatorios", details: error.message },
          { status: 500 }
        ))
      }
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Ruta ${route} no encontrada` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    
    // Errores específicos de Prisma
    if (error.code === 'P2002') {
      return handleCORS(NextResponse.json(
        { error: "Ya existe un registro con esos datos únicos" }, 
        { status: 409 }
      ))
    }
    
    if (error.code === 'P2025') {
      return handleCORS(NextResponse.json(
        { error: "Registro no encontrado" }, 
        { status: 404 }
      ))
    }

    // ============================================
    // ENVÍO - CÁLCULO CON GOOGLE MAPS
    // ============================================
    
    // POST /api/envio/calcular - Calcular costo de envío
    if (route === '/envio/calcular' && method === 'POST') {
      const body = await request.json()
      const { direccion_destino } = body

      if (!direccion_destino) {
        return handleCORS(NextResponse.json(
          { error: "La dirección de destino es requerida" },
          { status: 400 }
        ))
      }

      try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY
        const origen = process.env.FLORERIA_ADDRESS || "Av. Paseo de la Reforma 222, Juárez, Cuauhtémoc, 06600 Ciudad de México, CDMX, México"

        // Llamar a Google Distance Matrix API
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origen)}&destinations=${encodeURIComponent(direccion_destino)}&key=${apiKey}`
        
        const response = await fetch(url)
        const data = await response.json()

        if (data.status !== 'OK') {
          return handleCORS(NextResponse.json(
            { error: "No se pudo calcular la distancia. Verifica la dirección." },
            { status: 400 }
          ))
        }

        const element = data.rows[0].elements[0]
        
        if (element.status !== 'OK') {
          return handleCORS(NextResponse.json(
            { error: "No se pudo calcular la ruta. Verifica la dirección." },
            { status: 400 }
          ))
        }

        // Distancia en kilómetros
        const distanciaKm = element.distance.value / 1000
        const duracion = element.duration.text

        // NUEVA LÓGICA DE CÁLCULO DE COSTO
        // Costo base: $99 MXN (mínimo siempre)
        // Radio incluido: 10 km
        // Después de 10 km: $15 MXN por km adicional
        const COSTO_BASE = 99
        const RADIO_INCLUIDO = 10
        const COSTO_POR_KM = 15

        let costoEnvio = COSTO_BASE

        if (distanciaKm > RADIO_INCLUIDO) {
          const kmAdicionales = distanciaKm - RADIO_INCLUIDO
          const costoAdicional = Math.ceil(kmAdicionales) * COSTO_POR_KM
          costoEnvio = COSTO_BASE + costoAdicional
        }

        // Asegurar que el costo nunca sea menor a $99
        costoEnvio = Math.max(costoEnvio, COSTO_BASE)

        return handleCORS(NextResponse.json({
          distancia_km: Math.round(distanciaKm * 10) / 10,
          distancia_texto: element.distance.text,
          duracion: duracion,
          costo_envio: costoEnvio,
          direccion_origen: origen,
          direccion_destino: direccion_destino
        }))

      } catch (error) {
        console.error('Error en cálculo de envío:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al calcular el envío" },
          { status: 500 }
        ))
      }
    }

    // ============================================
    // ADMIN - CUPONES MANAGEMENT
    // ============================================
    
    // GET /api/admin/cupones - Listar todos los cupones (PROTEGIDO)
    if (route === '/admin/cupones' && method === 'GET') {
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
    if (route === '/admin/cupones' && method === 'POST') {
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

    // PATCH /api/admin/cupones/:id - Actualizar cupón (PROTEGIDO)
    if (route.startsWith('/admin/cupones/') && method === 'PATCH') {
      const authResult = await verifyAuth(request)
      
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        ))
      }

      try {
        const id = route.split('/').pop()
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

    // DELETE /api/admin/cupones/:id - Eliminar cupón (PROTEGIDO)
    if (route.startsWith('/admin/cupones/') && method === 'DELETE') {
      const authResult = await verifyAuth(request)
      
      if (!authResult.authenticated) {
        return handleCORS(NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        ))
      }

      try {
        const id = route.split('/').pop()

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

    // ============================================
    // CUPONES - SISTEMA DE DESCUENTOS (CLIENTE)
    // ============================================
    
    // POST /api/cupones/validar - Validar y aplicar cupón
    if (route === '/cupones/validar' && method === 'POST') {
      const body = await request.json()
      const { codigo, monto_pedido } = body

      if (!codigo) {
        return handleCORS(NextResponse.json(
          { error: "El código del cupón es requerido" },
          { status: 400 }
        ))
      }

      try {
        const cupon = await prisma.cupon.findUnique({
          where: { codigo: codigo.toUpperCase() }
        })

        if (!cupon) {
          return handleCORS(NextResponse.json(
            { error: "Cupón no válido" },
            { status: 404 }
          ))
        }

        if (!cupon.activo) {
          return handleCORS(NextResponse.json(
            { error: "Este cupón ya no está activo" },
            { status: 400 }
          ))
        }

        // Verificar fecha de validez
        const ahora = new Date()
        if (cupon.fecha_fin && new Date(cupon.fecha_fin) < ahora) {
          return handleCORS(NextResponse.json(
            { error: "Este cupón ha expirado" },
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
          descuento: descuento
        }))

      } catch (error) {
        console.error('Error validando cupón:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al validar el cupón" },
          { status: 500 }
        ))
      }
    }

    // POST /api/cupones/aplicar - Incrementar contador de usos
    if (route === '/cupones/aplicar' && method === 'POST') {
      const body = await request.json()
      const { codigo } = body

      try {
        const cupon = await prisma.cupon.update({
          where: { codigo: codigo.toUpperCase() },
          data: { usos: { increment: 1 } }
        })

        return handleCORS(NextResponse.json({ success: true, usos: cupon.usos }))
      } catch (error) {
        console.error('Error aplicando cupón:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al aplicar el cupón" },
          { status: 500 }
        ))
      }
    }

    // GET /api/cupones - Listar todos los cupones (admin)
    if (route === '/cupones' && method === 'GET') {
      const token = request.headers.get('authorization')?.split(' ')[1]
      const payload = verifyAuth(token)
      
      if (!payload) {
        return handleCORS(NextResponse.json({ error: "No autorizado" }, { status: 401 }))
      }

      const cupones = await prisma.cupon.findMany({
        orderBy: { createdAt: 'desc' }
      })

      return handleCORS(NextResponse.json(cupones))
    }

    // POST /api/cupones - Crear nuevo cupón (admin)
    if (route === '/cupones' && method === 'POST') {
      const token = request.headers.get('authorization')?.split(' ')[1]
      const payload = verifyAuth(token)
      
      if (!payload) {
        return handleCORS(NextResponse.json({ error: "No autorizado" }, { status: 401 }))
      }

      const body = await request.json()
      const { codigo, tipo, valor, activo, usos_maximos, fecha_fin } = body

      if (!codigo || !tipo || valor === undefined) {
        return handleCORS(NextResponse.json(
          { error: "Código, tipo y valor son requeridos" },
          { status: 400 }
        ))
      }

      const cupon = await prisma.cupon.create({
        data: {
          codigo: codigo.toUpperCase(),
          tipo,
          valor,
          activo: activo !== undefined ? activo : true,
          usos_maximos,
          fecha_fin: fecha_fin ? new Date(fecha_fin) : null
        }
      })

      return handleCORS(NextResponse.json(cupon, { status: 201 }))
    }

    if (error.code === 'P2003') {
      return handleCORS(NextResponse.json(
        { error: "Violación de restricción de clave foránea" }, 
        { status: 400 }
      ))
    }
    
    return handleCORS(NextResponse.json(
      { error: "Error interno del servidor", details: error.message }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
