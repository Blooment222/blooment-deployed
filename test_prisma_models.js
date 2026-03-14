// Test script to check Prisma models
import prisma from './lib/prisma.js'

async function testPrismaModels() {
  try {
    console.log('Testing Prisma Client models...')
    
    // Test Usuario model (should work)
    console.log('1. Testing Usuario model:')
    const usuarios = await prisma.usuario.findMany()
    console.log(`   Found ${usuarios.length} usuarios`)
    
    // Test Producto model (should work)
    console.log('2. Testing Producto model:')
    const productos = await prisma.producto.findMany()
    console.log(`   Found ${productos.length} productos`)
    
    // Test Cliente model (this is failing)
    console.log('3. Testing Cliente model:')
    try {
      const clientes = await prisma.cliente.findMany()
      console.log(`   Found ${clientes.length} clientes`)
    } catch (error) {
      console.log(`   ERROR: ${error.message}`)
    }
    
    // Test if we can inspect the database connection
    console.log('4. Testing database connection:')
    const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    console.log('   Tables in database:', result.map(r => r.table_name))
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testPrismaModels()