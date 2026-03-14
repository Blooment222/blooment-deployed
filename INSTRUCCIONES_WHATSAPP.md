# 📱 Integración de WhatsApp con Twilio - Blooment

## ✅ Estado: CÓDIGO IMPLEMENTADO - Pendiente Configuración de Credenciales

La integración de WhatsApp está completamente implementada y lista para funcionar. Solo necesitas configurar tu cuenta de Twilio y agregar las credenciales.

---

## 🎯 Funcionalidades Implementadas

### 1. **Nuevo Pedido** 📦
- ✅ Notificación al **Admin** con detalles completos del pedido
- ✅ Confirmación al **Cliente** con número de pedido y datos de entrega

### 2. **Actualizaciones de Estado** 📊
El sistema envía WhatsApp automáticamente cuando cambias el estado de un pedido:
- ✅ **Pendiente**: "Tu pedido está pendiente de confirmación"
- ✅ **En Preparación**: "Estamos creando tu hermoso arreglo floral"
- ✅ **Enviado**: "Tu pedido está en camino" (con dirección y horario)
- ✅ **Entregado**: "Tu pedido ha sido entregado exitosamente"
- ✅ **Cancelado**: "Tu pedido ha sido cancelado"

### 3. **Recordatorios de Fechas Especiales** 🎉
- ✅ WhatsApp a clientes 7 días antes de cumpleaños/aniversarios
- ✅ Mensaje personalizado con nombre, fecha y enlace a la tienda

---

## 📋 Paso 1: Crear Cuenta de Twilio

### A. Registro (5 minutos)

1. Ve a https://www.twilio.com/try-twilio
2. Completa el registro:
   - **Email**: blooment222@gmail.com (o tu email preferido)
   - **Contraseña**: [Elige una segura]
   - **Verifica** tu email y número de teléfono

3. **Primera pregunta**: "Which Twilio product are you here to use?"
   - Selecciona: **WhatsApp**

4. **Segunda pregunta**: "What do you plan to build?"
   - Selecciona: **Notifications & Alerts**

### B. Obtener Credenciales (2 minutos)

Una vez en el Dashboard de Twilio:

1. **Account SID**:
   - Lo encuentras en la página principal del dashboard
   - Empieza con `AC...`
   - Ejemplo: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

2. **Auth Token**:
   - Está justo debajo del Account SID
   - Haz clic en **"Show"** para verlo
   - Empieza con letras y números aleatorios

3. **Copia ambos** y guárdalos en un lugar seguro

---

## 📱 Paso 2: Activar WhatsApp Sandbox (Para Pruebas)

El Sandbox te permite probar WhatsApp inmediatamente sin necesidad de aprobación:

### A. Configurar Sandbox

1. En el Dashboard de Twilio, ve a:
   **Messaging** → **Try it out** → **Send a WhatsApp message**

2. Verás algo como:

```
Join your sandbox by sending this code from your WhatsApp:
join abc-123

to this number:
+1 415 523 8886
```

3. **Desde tu WhatsApp personal** (el del admin):
   - Abre WhatsApp
   - Crea un nuevo mensaje al número que te dieron (ej: +1 415 523 8886)
   - Envía el mensaje: `join abc-123` (usa TU código único)
   - Recibirás confirmación: "You are all set!"

4. **Copia el número del Sandbox**:
   - Ejemplo: `+14155238886`
   - Este es tu `TWILIO_WHATSAPP_FROM`

### B. Agregar Más Usuarios (Opcional)

Cualquier persona que quiera recibir mensajes de prueba debe:
1. Enviar `join abc-123` al número del Sandbox
2. Solo funciona en el Sandbox, en producción no se necesita

---

## 🔧 Paso 3: Configurar Variables de Entorno

Agrega estas líneas al archivo `.env` en la raíz del proyecto:

```env
# ========================================
# TWILIO WHATSAPP
# ========================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_FROM=+14155238886

# Número de WhatsApp del admin (formato: +52 + 10 dígitos)
ADMIN_WHATSAPP=+521234567890
ADMIN_PHONE=+521234567890
```

### ⚠️ IMPORTANTE: Formato de Números

**México**: Siempre usa el formato internacional completo
- ✅ Correcto: `+521234567890` (código país +52 + 10 dígitos)
- ❌ Incorrecto: `5212345678`, `1234567890`, `+52 123 456 7890`

---

## ♻️ Paso 4: Reiniciar el Servidor

Después de agregar las variables de entorno:

```bash
sudo supervisorctl restart nextjs
```

O simplemente reinicia tu servidor de desarrollo.

---

## 🧪 Paso 5: Probar la Integración

### Prueba 1: Nuevo Pedido

1. Asegúrate de que tu número de WhatsApp esté unido al Sandbox
2. Haz un pedido de prueba en la tienda
3. Deberías recibir:
   - WhatsApp al admin con detalles del pedido
   - WhatsApp al cliente (si su teléfono está en el Sandbox)

### Prueba 2: Cambio de Estado

1. Ve al panel de admin: `/admin/pedidos`
2. Cambia el estado de un pedido (ej: Pendiente → En Preparación)
3. El cliente debería recibir un WhatsApp con la actualización

### Prueba 3: Recordatorios

1. Crea un contacto favorito con fecha especial en 4-5 días
2. Llama manualmente al endpoint:
   ```
   GET http://localhost:3000/api/cron/recordatorios-fechas
   ```
3. Deberías recibir un WhatsApp con el recordatorio

---

## 📊 Verificar Logs

Para ver si los mensajes se están enviando:

```bash
tail -f /var/log/supervisor/nextjs.out.log | grep "WhatsApp"
```

Busca mensajes como:
- `📱 Enviando WhatsApp de whatsapp:+14155238886 a whatsapp:+521234567890`
- `✅ WhatsApp enviado exitosamente. SID: SMxxxxx, Estado: queued`

---

## 🚀 Paso 6: Producción (Opcional)

### Pasar del Sandbox a Producción

Cuando quieras enviar WhatsApp a cualquier cliente (no solo los que se unieron al Sandbox):

1. **Solicitar Número WhatsApp Business**:
   - En Twilio Console: **Messaging** → **WhatsApp Senders**
   - Click **Request Access**
   - Proceso de aprobación: 1-5 días hábiles

2. **Requerimientos**:
   - Verificación de negocio (México)
   - Número de teléfono dedicado (+52)
   - Templates de mensajes pre-aprobados

3. **Costo** (México):
   - ~$0.0085 USD por mensaje conversacional
   - Los primeros 1,000 mensajes al mes son gratis

### Actualizar Variables para Producción

```env
TWILIO_WHATSAPP_FROM=+5212345678XX  # Tu número de WhatsApp Business
```

---

## 💰 Costos de Twilio

### Sandbox (Pruebas)
- ✅ **GRATIS** ilimitado
- ⚠️ Solo para usuarios que se unen con `join abc-123`

### Producción (México)
- **Mensajes de negocio**: $0.0085 USD (~$0.15 MXN) por mensaje
- **Sesión conversacional**: 24 horas desde el último mensaje
- **Gratis**: Primeros 1,000 mensajes/mes
- **Ejemplo**: 500 pedidos/mes = ~$4.25 USD (~$75 MXN)

---

## ❓ Troubleshooting

### Error: "TWILIO_ACCOUNT_SID no está configurada"
- ✅ Verifica que agregaste las variables al archivo `.env`
- ✅ Reinicia el servidor después de agregar las variables

### Error: "21610: Attempt to send to unsubscribed recipient"
- ⚠️ En Sandbox: El destinatario debe enviar `join abc-123` primero
- ✅ En Producción: Este error no ocurre

### No recibo WhatsApp pero no hay errores
- ✅ Verifica el formato del número: `+521234567890`
- ✅ Revisa los logs: `tail -f /var/log/supervisor/nextjs.out.log`
- ✅ En Sandbox: Asegúrate de haberte unido correctamente

### Los mensajes aparecen como "queued" pero no llegan
- ✅ Verifica en Twilio Console → Messaging → Logs
- ✅ Puede tomar 1-2 minutos en llegar

---

## 📞 Recursos

- **Twilio Console**: https://console.twilio.com
- **Documentación WhatsApp**: https://www.twilio.com/docs/whatsapp
- **Sandbox Guide**: https://www.twilio.com/docs/whatsapp/sandbox
- **Pricing**: https://www.twilio.com/whatsapp/pricing

---

## ✅ Checklist de Implementación

- [ ] Cuenta de Twilio creada
- [ ] Account SID y Auth Token obtenidos
- [ ] WhatsApp Sandbox activado
- [ ] Admin se unió al Sandbox (`join abc-123`)
- [ ] Variables de entorno agregadas a `.env`
- [ ] Servidor reiniciado
- [ ] Probado con un pedido de prueba
- [ ] Logs verificados (sin errores)
- [ ] Cliente recibió WhatsApp de confirmación
- [ ] Admin recibió WhatsApp de notificación

---

**Fecha de implementación**: Marzo 8, 2025  
**Estado**: ✅ Código listo - Pendiente configuración de Twilio  
**Soporte**: diego@blooment.com
