import { sendTestEmail } from '../lib/email.js'

async function test() {
  console.log('📧 Enviando email de prueba...\n')
  
  const result = await sendTestEmail()
  
  if (result) {
    console.log('\n✅ ¡Email enviado exitosamente!')
    console.log('📬 Revisa la bandeja de: blooment@gmail.com\n')
  } else {
    console.log('\n❌ No se pudo enviar el email')
    process.exit(1)
  }
}

test()
