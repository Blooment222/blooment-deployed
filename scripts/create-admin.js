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
  console.log('\n👤 CREAR NUEVO ADMINISTRADOR\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    // Pedir datos
    const nombre = await question('Nombre completo: ')
    const email = await question('Email: ')
    const password = await question('Contraseña (mínimo 6 caracteres): ')

    // Validaciones
    if (!nombre || !email || !password) {
      console.log('\n❌ Todos los campos son requeridos.\n')
      process.exit(1)
    }

    if (password.length < 6) {
      console.log('\n❌ La contraseña debe tener al menos 6 caracteres.\n')
      process.exit(1)
    }

    // Verificar si el email ya existe
    const existente = await prisma.administrador.findUnique({
      where: { email }
    })

    if (existente) {
      console.log('\n❌ Ya existe un administrador con ese email.\n')
      process.exit(1)
    }

    // Hashear contraseña y crear
    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await prisma.administrador.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        activo: true
      }
    })

    console.log('\n✅ ¡Administrador creado exitosamente!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📋 CREDENCIALES:\n')
    console.log(`   Nombre: ${admin.nombre}`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Password: ${password}\n`)
    console.log('⚠️  Guarda estas credenciales en un lugar seguro.\n')

    // Mostrar todos los administradores
    const todos = await prisma.administrador.findMany({
      select: { nombre: true, email: true, activo: true }
    })

    console.log('👥 Administradores actuales:\n')
    todos.forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.nombre} (${a.email}) ${a.activo ? '✅' : '❌'}`)
    })
    console.log('\n')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\nDetalles:', error)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

main()
