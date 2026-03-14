const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Obtener argumentos: email y nueva contraseña
  const args = process.argv.slice(2)
  
  if (args.length !== 2) {
    console.log('\n❌ Uso incorrecto.\n')
    console.log('Uso correcto:')
    console.log('  node scripts/change-password-quick.js <email> <nueva-contraseña>\n')
    console.log('Ejemplo:')
    console.log('  node scripts/change-password-quick.js admin@blooment.com MiNuevaPassword2025!\n')
    process.exit(1)
  }

  const email = args[0]
  const nuevaPassword = args[1]

  console.log('\n🔐 CAMBIAR CONTRASEÑA - MODO RÁPIDO\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    // Buscar administrador
    const admin = await prisma.administrador.findUnique({
      where: { email }
    })

    if (!admin) {
      console.log(`❌ No se encontró administrador con email: ${email}\n`)
      
      // Mostrar administradores disponibles
      const admins = await prisma.administrador.findMany({
        select: { email: true }
      })
      
      console.log('Administradores disponibles:')
      admins.forEach(a => console.log(`  • ${a.email}`))
      console.log('')
      
      process.exit(1)
    }

    // Validar contraseña
    if (nuevaPassword.length < 6) {
      console.log('❌ La contraseña debe tener al menos 6 caracteres.\n')
      process.exit(1)
    }

    // Hashear y actualizar
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10)

    await prisma.administrador.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    })

    console.log('✅ ¡Contraseña actualizada exitosamente!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📋 NUEVAS CREDENCIALES:\n')
    console.log(`   Email: ${admin.email}`)
    console.log(`   Contraseña: ${nuevaPassword}\n`)
    console.log('⚠️  Guarda esta información en un lugar seguro.\n')
    console.log('🔗 Accede ahora: https://petal-shop-api.preview.emergentagent.com/admin\n')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\nDetalles:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
