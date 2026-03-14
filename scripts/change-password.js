const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('\n🔐 CAMBIAR CONTRASEÑA DE ADMINISTRADOR\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    // Mostrar lista de administradores
    const admins = await prisma.administrador.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        activo: true
      }
    })

    if (admins.length === 0) {
      console.log('❌ No hay administradores en la base de datos.\n')
      process.exit(1)
    }

    console.log('📋 Administradores disponibles:\n')
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.nombre} (${admin.email}) ${admin.activo ? '✅' : '❌'}`)
    })

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Seleccionar administrador
    const seleccion = await question('Selecciona el número del administrador: ')
    const index = parseInt(seleccion) - 1

    if (index < 0 || index >= admins.length) {
      console.log('\n❌ Selección inválida.\n')
      process.exit(1)
    }

    const adminSeleccionado = admins[index]
    console.log(`\n✓ Cambiarás la contraseña de: ${adminSeleccionado.email}\n`)

    // Pedir nueva contraseña
    const nuevaPassword = await question('Nueva contraseña (mínimo 6 caracteres): ')

    if (nuevaPassword.length < 6) {
      console.log('\n❌ La contraseña debe tener al menos 6 caracteres.\n')
      process.exit(1)
    }

    const confirmarPassword = await question('Confirma la nueva contraseña: ')

    if (nuevaPassword !== confirmarPassword) {
      console.log('\n❌ Las contraseñas no coinciden.\n')
      process.exit(1)
    }

    // Hashear y actualizar
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10)

    await prisma.administrador.update({
      where: { id: adminSeleccionado.id },
      data: { password: hashedPassword }
    })

    console.log('\n✅ ¡Contraseña actualizada exitosamente!\n')
    console.log(`📧 Email: ${adminSeleccionado.email}`)
    console.log(`🔒 Nueva contraseña: ${nuevaPassword}\n`)
    console.log('⚠️  Guarda esta información en un lugar seguro.\n')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\nDetalles:', error)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

main()
