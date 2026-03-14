const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 Creando tablas en PostgreSQL...\n')
    
    // Create tables using raw SQL
    await prisma.$executeRawUnsafe(`
      -- Tabla Usuarios
      CREATE TABLE IF NOT EXISTS usuarios (
        id VARCHAR(36) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        telefono VARCHAR(50),
        direccion TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('✅ Tabla usuarios creada')

    await prisma.$executeRawUnsafe(`
      -- Tabla Productos
      CREATE TABLE IF NOT EXISTS productos (
        id VARCHAR(36) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10, 2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        imagen_url TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('✅ Tabla productos creada')

    await prisma.$executeRawUnsafe(`
      -- Tabla Pedidos
      CREATE TABLE IF NOT EXISTS pedidos (
        id VARCHAR(36) PRIMARY KEY,
        "usuarioId" VARCHAR(36) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
        fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("usuarioId") REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `)
    console.log('✅ Tabla pedidos creada')
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "pedidos_usuarioId_idx" ON pedidos("usuarioId");
    `)
    console.log('✅ Índice en pedidos.usuarioId creado')

    await prisma.$executeRawUnsafe(`
      -- Tabla Detalles Pedido
      CREATE TABLE IF NOT EXISTS detalles_pedido (
        id VARCHAR(36) PRIMARY KEY,
        "pedidoId" VARCHAR(36) NOT NULL,
        "productoId" VARCHAR(36) NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("pedidoId") REFERENCES pedidos(id) ON DELETE CASCADE,
        FOREIGN KEY ("productoId") REFERENCES productos(id) ON DELETE RESTRICT
      );
    `)
    console.log('✅ Tabla detalles_pedido creada')

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "detalles_pedido_pedidoId_idx" ON detalles_pedido("pedidoId");
    `)
    console.log('✅ Índice en detalles_pedido.pedidoId creado')

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "detalles_pedido_productoId_idx" ON detalles_pedido("productoId");
    `)
    console.log('✅ Índice en detalles_pedido.productoId creado')

    await prisma.$executeRawUnsafe(`
      -- Tabla Pagos
      CREATE TABLE IF NOT EXISTS pagos (
        id VARCHAR(36) PRIMARY KEY,
        "pedidoId" VARCHAR(36) NOT NULL,
        "usuarioId" VARCHAR(36) NOT NULL,
        monto DECIMAL(10, 2) NOT NULL,
        metodo VARCHAR(100) NOT NULL,
        estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
        referencia_externa VARCHAR(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("pedidoId") REFERENCES pedidos(id) ON DELETE CASCADE,
        FOREIGN KEY ("usuarioId") REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `)
    console.log('✅ Tabla pagos creada')

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "pagos_pedidoId_idx" ON pagos("pedidoId");
    `)
    console.log('✅ Índice en pagos.pedidoId creado')

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "pagos_usuarioId_idx" ON pagos("usuarioId");
    `)
    console.log('✅ Índice en pagos.usuarioId creado')

    console.log('\n🎉 ¡Todas las tablas creadas exitosamente!')
    console.log('\n📋 Tablas creadas:')
    console.log('  ✓ usuarios')
    console.log('  ✓ productos')
    console.log('  ✓ pedidos')
    console.log('  ✓ detalles_pedido')
    console.log('  ✓ pagos')
    console.log('\n🔗 Relaciones configuradas:')
    console.log('  ✓ pedidos -> usuarios (CASCADE)')
    console.log('  ✓ detalles_pedido -> pedidos (CASCADE)')
    console.log('  ✓ detalles_pedido -> productos (RESTRICT)')
    console.log('  ✓ pagos -> pedidos (CASCADE)')
    console.log('  ✓ pagos -> usuarios (CASCADE)')
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Las tablas ya existen. Esto es normal.')
    } else {
      console.error('❌ Error:', error.message)
      console.error('\nDetalles:', error)
      process.exit(1)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
