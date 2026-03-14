import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth, verifyClientAuth, generateToken, comparePassword, hashPassword } from '@/lib/auth'
import Stripe from 'stripe'

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

      // Buscar administrador
      const admin = await prisma.administrador.findUnique({
        where: { email: body.email }
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
        // Query con todos los campos disponibles
        const productos = await prisma.$queryRaw`
          SELECT 
            id, 
            nombre, 
            descripcion, 
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
    
    // GET /api/pedidos - Listar todos los pedidos
    if (route === '/pedidos' && method === 'GET') {
      const pedidos = await prisma.pedido.findMany({
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

        const pedidos = await prisma.pedido.findMany({
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
          const { enviarNotificacionCliente } = require('@/lib/email')
          await enviarNotificacionCliente(pedido, pedido.cliente, body.estado)
          console.log(`✅ Notificación enviada al cliente para estado: ${body.estado}`)
        } catch (emailError) {
          console.error('⚠️ Error enviando notificación (no crítico):', emailError)
          // No bloqueamos la respuesta si falla el email
        }
        
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
        
        if (!authResult.authenticated) {
          return handleCORS(NextResponse.json(
            { error: "No autenticado" },
            { status: 401 }
          ))
        }

        const pedidoId = updatePedidoMatch[1]
        const body = await request.json()
        
        // Verificar que el pedido existe y pertenece al cliente
        const pedido = await prisma.pedido.findFirst({
          where: {
            id: pedidoId,
            clienteId: authResult.decoded.userId
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
            direccion_envio: body.direccion_envio || pedido.direccion_envio,
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
        
        return handleCORS(NextResponse.json({
          message: "Pedido actualizado exitosamente",
          pedido: pedidoActualizado
        }))
        
      } catch (error) {
        console.error('Error actualizando pedido:', error)
        return handleCORS(NextResponse.json(
          { error: "Error al actualizar pedido" },
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
            tel_destinatario: detallesEntrega?.tel_destinatario || '',
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
          // Usar sintaxis de relaciones de Prisma para conectar usuario y cliente
          const nuevoPedido = await tx.pedido.create({
            data: {
              // Conectar relaciones (en lugar de IDs directos)
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
          const { enviarNotificacionCliente, enviarNotificacionAdmin } = require('@/lib/email')
          
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
