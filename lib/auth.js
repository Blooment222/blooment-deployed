import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key'

/**
 * Genera un JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h' // Token válido por 24 horas
  })
}

/**
 * Verifica un JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Hashea una contraseña
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10)
}

/**
 * Compara una contraseña con su hash
 */
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword)
}

/**
 * Middleware para verificar autenticación en API routes (Admin)
 */
export async function verifyAuth(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'No token provided' }
    }

    const token = authHeader.substring(7) // Remove 'Bearer '
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return { authenticated: false, error: 'Invalid or expired token' }
    }

    // Verificar que el usuario existe y está activo
    const admin = await prisma.administrador.findUnique({
      where: { id: decoded.userId },
      select: { id: true, nombre: true, email: true, activo: true }
    })

    if (!admin || !admin.activo) {
      return { authenticated: false, error: 'User not found or inactive' }
    }

    return { authenticated: true, user: admin }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { authenticated: false, error: 'Authentication failed' }
  }
}

/**
 * Middleware para verificar autenticación de clientes
 */
export async function verifyClientAuth(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    console.log('🔐 Verificando auth de cliente:', { 
      hasHeader: !!authHeader,
      headerPreview: authHeader ? authHeader.substring(0, 20) + '...' : 'none'
    })
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token o formato incorrecto')
      return { authenticated: false, error: 'No token provided' }
    }

    const token = authHeader.substring(7) // Remove 'Bearer '
    console.log('🎫 Token extraído (primeros 30 chars):', token.substring(0, 30) + '...')
    
    const decoded = verifyToken(token)
    
    console.log('🔓 Token decoded:', { decoded: decoded ? 'yes' : 'no', type: decoded?.type, userId: decoded?.userId })
    
    if (!decoded) {
      console.log('❌ Token inválido o expirado')
      return { authenticated: false, error: 'Invalid or expired token' }
    }

    // Verificar que es un token de cliente
    if (decoded.type !== 'cliente') {
      console.log('❌ Tipo de token incorrecto:', decoded.type)
      return { authenticated: false, error: 'Invalid token type' }
    }

    // Verificar que el cliente existe y está activo
    const cliente = await prisma.cliente.findUnique({
      where: { id: decoded.userId },
      select: { id: true, nombre: true, email: true, activo: true }
    })
    
    console.log('👤 Cliente encontrado:', { found: !!cliente, activo: cliente?.activo })

    if (!cliente || !cliente.activo) {
      console.log('❌ Cliente no encontrado o inactivo')
      return { authenticated: false, error: 'Client not found or inactive' }
    }

    console.log('✅ Autenticación exitosa para cliente:', cliente.email)
    return { authenticated: true, user: { userId: cliente.id, email: cliente.email, nombre: cliente.nombre } }
  } catch (error) {
    console.error('❌ Client auth verification error:', error)
    return { authenticated: false, error: 'Authentication failed: ' + error.message }
  }
}
