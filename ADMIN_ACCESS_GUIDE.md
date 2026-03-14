# 🔐 Guía de Gestión de Administradores - Blooment

## 📋 Información de Acceso Actual

### 🔑 Credenciales Iniciales

```
Email: admin@blooment.com
Password: admin123
```

**⚠️ IMPORTANTE:** Esta contraseña debe cambiarse inmediatamente en producción.

---

## 📍 Dónde Está Todo

### 1. Base de Datos
- **Ubicación:** PostgreSQL en Supabase
- **Tabla:** `administradores`
- **Acceso:** https://supabase.com/dashboard → Tu proyecto → Table Editor
- **Passwords:** Hasheados con bcrypt (no se pueden ver en texto plano por seguridad)

### 2. Configuración del Sistema
- **Archivo:** `/app/.env`
- **JWT Secret:** `JWT_SECRET=blooment_secret_key_2025...`
- **Conexión BD:** `DATABASE_URL=postgresql://...`

---

## 🛠️ Herramientas de Gestión

He creado 4 scripts interactivos para gestionar administradores fácilmente:

### 1️⃣ Ver Todos los Administradores

```bash
cd /app
node scripts/list-admins.js
```

**Qué hace:**
- Muestra lista completa de administradores
- Estado (activo/inactivo)
- Fecha de creación
- IDs y emails

**Ejemplo de salida:**
```
👥 LISTA DE ADMINISTRADORES

Total: 2 administrador(es)

1. 🟢 ACTIVO
   Nombre: Administrador
   Email: admin@blooment.com
   ID: abc123...
   Creado: 03/03/2026

2. 🟢 ACTIVO
   Nombre: María López
   Email: maria@blooment.com
   ID: def456...
   Creado: 03/03/2026
```

---

### 2️⃣ Cambiar Contraseña

```bash
cd /app
node scripts/change-password.js
```

**Qué hace:**
- Muestra lista de administradores
- Te permite seleccionar uno
- Pide nueva contraseña
- Confirma la contraseña
- Actualiza en la base de datos

**Ejemplo de uso:**
```
🔐 CAMBIAR CONTRASEÑA DE ADMINISTRADOR

📋 Administradores disponibles:

1. Administrador (admin@blooment.com) ✅
2. María López (maria@blooment.com) ✅

Selecciona el número del administrador: 1

✓ Cambiarás la contraseña de: admin@blooment.com

Nueva contraseña (mínimo 6 caracteres): MiPassword2025!
Confirma la nueva contraseña: MiPassword2025!

✅ ¡Contraseña actualizada exitosamente!

📧 Email: admin@blooment.com
🔒 Nueva contraseña: MiPassword2025!

⚠️  Guarda esta información en un lugar seguro.
```

---

### 3️⃣ Crear Nuevo Administrador

```bash
cd /app
node scripts/create-admin.js
```

**Qué hace:**
- Pide nombre completo
- Pide email
- Pide contraseña
- Valida que el email no exista
- Crea el administrador
- Muestra las credenciales

**Ejemplo de uso:**
```
👤 CREAR NUEVO ADMINISTRADOR

Nombre completo: María López
Email: maria@blooment.com
Contraseña (mínimo 6 caracteres): Maria2025!

✅ ¡Administrador creado exitosamente!

📋 CREDENCIALES:

   Nombre: María López
   Email: maria@blooment.com
   Password: Maria2025!

⚠️  Guarda estas credenciales en un lugar seguro.

👥 Administradores actuales:

   1. Administrador (admin@blooment.com) ✅
   2. María López (maria@blooment.com) ✅
```

---

### 4️⃣ Desactivar Administrador

```bash
cd /app
node scripts/deactivate-admin.js
```

**Qué hace:**
- Muestra administradores activos
- Permite desactivar uno (no eliminar, por seguridad)
- Evita desactivar el último administrador
- Confirma la acción

**Ejemplo de uso:**
```
🔴 DESACTIVAR ADMINISTRADOR

📋 Administradores activos:

1. Administrador (admin@blooment.com)
2. María López (maria@blooment.com)

Selecciona el número del administrador a desactivar (0 para cancelar): 2

⚠️  ¿Estás seguro de desactivar a maria@blooment.com? (si/no): si

✅ Administrador desactivado exitosamente.

   maria@blooment.com ya no puede acceder al panel.

👥 Administradores activos restantes: 1
```

---

## 🚀 Guía Rápida para 2 Personas

### Opción A: Usar las Mismas Credenciales (Menos Recomendado)

Ambas personas usan:
- Email: `admin@blooment.com`
- Password: `admin123` (cámbiala primero)

**Pasos:**
1. Cambia la contraseña: `node scripts/change-password.js`
2. Comparte la nueva contraseña de forma segura (WhatsApp, etc.)

### Opción B: Crear un Administrador para Cada Persona (Recomendado) ✅

**Para la Primera Persona:**
- Ya existe: `admin@blooment.com`
- Cambiar password: `node scripts/change-password.js`

**Para la Segunda Persona:**
```bash
cd /app
node scripts/create-admin.js
```

Crear con:
- Nombre: María López (o el nombre real)
- Email: maria@blooment.com (email real)
- Password: Password seguro

---

## 📱 Acceso desde el Navegador

### URL del Panel Admin:
```
https://petal-shop-api.preview.emergentagent.com/admin
```

**Flujo:**
1. Abre el enlace
2. Te redirige automáticamente a `/admin/login`
3. Ingresa email y contraseña
4. Click en "Iniciar Sesión"
5. Accedes al dashboard

---

## 🔄 Cambiar Contraseña desde el Panel (Futuro)

Actualmente puedes cambiar contraseñas desde la línea de comandos. Si necesitas una interfaz gráfica en el panel, puedo agregar:
- Página de perfil
- Botón "Cambiar Contraseña"
- Formulario para cambiar password

¿Quieres que agregue esto?

---

## 🆘 Problemas Comunes y Soluciones

### ❌ "Email o contraseña incorrectos"
**Solución:**
1. Verifica que estés usando el email correcto
2. Verifica la contraseña (sensible a mayúsculas)
3. Si olvidaste la contraseña, usa: `node scripts/change-password.js`

### ❌ "Token expirado"
**Solución:**
- Los tokens duran 24 horas
- Cierra sesión y vuelve a iniciar sesión
- El sistema te redirige automáticamente al login

### ❌ "No puedo ejecutar los scripts"
**Solución:**
```bash
# Asegúrate de estar en el directorio correcto
cd /app

# Verifica que Node.js esté instalado
node --version

# Ejecuta el script
node scripts/list-admins.js
```

### ❌ "Olvidé mi contraseña"
**Solución:**
```bash
cd /app
node scripts/change-password.js
# Selecciona tu usuario y crea una nueva contraseña
```

---

## 🔒 Mejores Prácticas de Seguridad

### ✅ Hacer:
1. **Cambiar contraseña por defecto inmediatamente**
2. **Usar contraseñas fuertes** (mínimo 8 caracteres, mayúsculas, minúsculas, números)
3. **No compartir credenciales por email**
4. **Crear un administrador separado para cada persona**
5. **Desactivar administradores que ya no lo necesitan**
6. **Guardar credenciales en un gestor de contraseñas** (1Password, LastPass, etc.)

### ❌ Evitar:
1. Usar contraseñas simples como "123456" o "password"
2. Compartir la misma cuenta entre más de 2 personas
3. Dejar contraseñas escritas en papeles
4. Usar la contraseña por defecto en producción

---

## 📊 Resumen de Comandos

```bash
# Ver administradores
node scripts/list-admins.js

# Cambiar contraseña
node scripts/change-password.js

# Crear nuevo admin
node scripts/create-admin.js

# Desactivar admin
node scripts/deactivate-admin.js

# Verificar que la base de datos funcione
node scripts/test-db.js
```

---

## 🔐 Información Técnica

### Seguridad Implementada:
- **Bcrypt:** Passwords hasheados con 10 rounds
- **JWT:** Tokens firmados con clave secreta
- **Expiración:** Tokens válidos por 24 horas
- **HTTPS:** Comunicación encriptada
- **localStorage:** Token guardado localmente en el navegador

### Acceso a la Base de Datos:
Si necesitas acceso directo a Supabase:
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "Table Editor"
4. Selecciona tabla "administradores"
5. Puedes ver usuarios (passwords están hasheados)

---

## 📞 Soporte

Si necesitas ayuda para:
- Cambiar contraseñas
- Crear nuevos administradores
- Problemas de acceso
- Agregar funcionalidades

Solo avísame y te ayudo inmediatamente.

---

## ✅ Checklist Inicial

Antes de empezar en producción, completa:

- [ ] Cambiar contraseña por defecto de `admin@blooment.com`
- [ ] Crear segundo administrador (si aplica)
- [ ] Verificar que ambos pueden acceder
- [ ] Guardar credenciales en lugar seguro
- [ ] Probar cambio de contraseña
- [ ] Probar logout y re-login
- [ ] Documentar credenciales en lugar seguro

---

**¡Tu panel está listo y seguro! 🔐✨**

Para cualquier duda, estoy aquí para ayudarte.
