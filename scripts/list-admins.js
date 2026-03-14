const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('\n👥 LISTA DE ADMINISTRADORES\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
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

    if (admins.length === 0) {
      console.log('❌ No hay administradores en la base de datos.\n')
      process.exit(0)
    }

    console.log(`Total: ${admins.length} administrador(es)\n`)

    admins.forEach((admin, index) => {
      const fecha = new Date(admin.createdAt).toLocaleDateString('es-ES')
      const status = admin.activo ? '🟢 ACTIVO' : '🔴 INACTIVO'
      
      console.log(`${index + 1}. ${status}`)
      console.log(`   Nombre: ${admin.nombre}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   ID: ${admin.id}`)
      console.log(`   Creado: ${fecha}\n`)
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('💡 Comandos útiles:')
    console.log('   • Cambiar contraseña: node scripts/change-password.js')
    console.log('   • Crear admin: node scripts/create-admin.js')
    console.log('   • Desactivar admin: node scripts/deactivate-admin.js\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
