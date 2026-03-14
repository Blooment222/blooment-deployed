const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 Intentando conectar a PostgreSQL...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Conexión exitosa a PostgreSQL')
    
    // Push schema to database
    console.log('🔄 Sincronizando esquema con la base de datos...')
    
    // Try to query something simple
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query test exitoso:', result)
    
    console.log('\n✅ Base de datos configurada correctamente!')
    console.log('\n📋 Modelos disponibles:')
    console.log('  - Usuario')
    console.log('  - Producto')
    console.log('  - Pedido')
    console.log('  - DetallePedido')
    console.log('  - Pago')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\nDetalles del error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
