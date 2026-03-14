const nodemailer = require('nodemailer')

async function testEmail() {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: 'blooment@gmail.com',
      pass: 'ixsjxhrccxzidygz' // Sin espacios
    }
  })

  try {
    const info = await transporter.sendMail({
      from: '"Blooment Test" <blooment@gmail.com>',
      to: 'blooment@gmail.com',
      subject: '✅ Test - Sistema de Notificaciones Blooment',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🎉 ¡Sistema de Notificaciones Funcionando!</h2>
          <p>Este es un email de prueba del sistema Blooment Admin Panel.</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          <p>Si recibes este correo, significa que el sistema está configurado correctamente.</p>
          <hr style="margin: 20px 0;"/>
          <p style="color: #666; font-size: 12px;">
            Este es un mensaje automático del Panel de Administración Blooment
          </p>
        </div>
      `
    })

    console.log('✅ Email enviado exitosamente!')
    console.log('📧 Message ID:', info.messageId)
    console.log('📬 Revisa tu bandeja: blooment@gmail.com')
    console.log('')
    console.log('✨ El sistema de notificaciones está listo para usar!')
  } catch (error) {
    console.error('❌ Error al enviar email:', error.message)
    process.exit(1)
  }
}

testEmail()
