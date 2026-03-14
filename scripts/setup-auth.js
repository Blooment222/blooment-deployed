const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 Creando tabla de administradores...\n')
    
    // Crear tabla de administradores
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS administradores (
        id VARCHAR(36) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        activo BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('✅ Tabla administradores creada')

    // Crear índice en email
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "administradores_email_idx" ON administradores(email);
    `)
    console.log('✅ Índice en administradores.email creado')

    // Verificar si ya existe un admin
    const existingAdmin = await prisma.administrador.findFirst()
    
    if (!existingAdmin) {
      // Crear usuario administrador por defecto
      const hashedPassword = await bcrypt.hash('admin123', 10)
      
      const admin = await prisma.administrador.create({
        data: {
          nombre: 'Administrador',
          email: 'admin@blooment.com',
          password: hashedPassword,
          activo: true
        }
      })

      console.log('\n✅ Usuario administrador creado:')
      console.log('   Email: admin@blooment.com')
      console.log('   Password: admin123')
      console.log('   ⚠️  IMPORTANTE: Cambia esta contraseña después del primer login!\n')
    } else {
      console.log('\n⚠️  Ya existe un administrador. No se creará uno nuevo.\n')
    }

    console.log('🎉 ¡Configuración de autenticación completada!')
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  La tabla ya existe. Esto es normal.')
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
