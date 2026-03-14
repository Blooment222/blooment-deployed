const { PrismaClient } = require('@prisma/client')
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
  console.log('\n🔴 DESACTIVAR ADMINISTRADOR\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    // Mostrar lista de administradores activos
    const admins = await prisma.administrador.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        email: true
      }
    })

    if (admins.length === 0) {
      console.log('❌ No hay administradores activos.\n')
      process.exit(0)
    }

    if (admins.length === 1) {
      console.log('⚠️  Solo hay 1 administrador activo.')
      console.log('   No puedes desactivar el último administrador.\n')
      process.exit(0)
    }

    console.log('📋 Administradores activos:\n')
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.nombre} (${admin.email})`)
    })

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Seleccionar administrador
    const seleccion = await question('Selecciona el número del administrador a desactivar (0 para cancelar): ')
    const index = parseInt(seleccion) - 1

    if (index === -1) {
      console.log('\n✓ Operación cancelada.\n')
      process.exit(0)
    }

    if (index < 0 || index >= admins.length) {
      console.log('\n❌ Selección inválida.\n')
      process.exit(1)
    }

    const adminSeleccionado = admins[index]
    
    const confirmar = await question(`\n⚠️  ¿Estás seguro de desactivar a ${adminSeleccionado.email}? (si/no): `)

    if (confirmar.toLowerCase() !== 'si' && confirmar.toLowerCase() !== 'sí') {
      console.log('\n✓ Operación cancelada.\n')
      process.exit(0)
    }

    // Desactivar
    await prisma.administrador.update({
      where: { id: adminSeleccionado.id },
      data: { activo: false }
    })

    console.log('\n✅ Administrador desactivado exitosamente.\n')
    console.log(`   ${adminSeleccionado.email} ya no puede acceder al panel.\n`)

    // Mostrar admins activos restantes
    const restantes = await prisma.administrador.count({
      where: { activo: true }
    })

    console.log(`👥 Administradores activos restantes: ${restantes}\n`)

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

main()
