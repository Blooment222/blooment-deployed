# 🔑 CREDENCIALES DE ACCESO - BLOOMENT ADMIN

## 📱 URL de Acceso
```
https://petal-shop-api.preview.emergentagent.com/admin
```

---

## 👤 CREDENCIALES ACTUALES

### Usuario Administrador Principal

```
Email: admin@blooment.com
Password: admin123
```

**⚠️ ACCIÓN REQUERIDA: CAMBIAR ESTA CONTRASEÑA INMEDIATAMENTE**

---

## 🔧 CÓMO CAMBIAR LA CONTRASEÑA

### Opción 1: Usando el Script (Recomendado)

```bash
cd /app
node scripts/change-password.js
```

Sigue las instrucciones:
1. Selecciona el administrador (admin@blooment.com)
2. Ingresa nueva contraseña (mínimo 6 caracteres)
3. Confirma la contraseña
4. ¡Listo! Guarda la nueva contraseña

---

## 👥 CREAR SEGUNDO ADMINISTRADOR

Para que 2 personas tengan acceso independiente:

```bash
cd /app
node scripts/create-admin.js
```

Ejemplo de datos:
```
Nombre completo: María López
Email: maria@blooment.com
Contraseña: TuPasswordSegura2025!
```

---

## 📋 VER TODOS LOS ADMINISTRADORES

```bash
cd /app
node scripts/list-admins.js
```

---

## 📍 UBICACIÓN DE LOS DATOS

### Base de Datos
- **Servicio:** Supabase (PostgreSQL)
- **URL:** https://supabase.com/dashboard
- **Tabla:** administradores
- **Nota:** Los passwords están hasheados (no se pueden ver en texto plano)

### Archivo de Configuración
- **Ubicación:** `/app/.env`
- **Variables importantes:**
  - `JWT_SECRET` - Clave para firmar tokens
  - `DATABASE_URL` - Conexión a PostgreSQL

---

## 🚨 EN CASO DE EMERGENCIA

### Olvidé mi contraseña
```bash
cd /app
node scripts/change-password.js
```

### Necesito crear un administrador urgente
```bash
cd /app
node scripts/create-admin.js
```

### No puedo acceder al sistema
1. Verifica que estés usando el email correcto
2. Verifica mayúsculas/minúsculas en la contraseña
3. Si olvidaste la contraseña, usa el script para cambiarla
4. Si el problema persiste, contacta soporte técnico

---

## ✅ CHECKLIST DE SEGURIDAD

**Antes de usar en producción:**

- [ ] Cambiar contraseña por defecto (admin123)
- [ ] Crear segundo administrador (si aplica)
- [ ] Guardar credenciales en lugar seguro
- [ ] Probar que ambos administradores pueden acceder
- [ ] Documentar credenciales en gestor de contraseñas
- [ ] No compartir credenciales por email o mensajes no seguros

---

## 📞 CONTACTO DE SOPORTE

Para problemas con acceso, credenciales o cualquier duda:
- Contacta al equipo técnico
- Proporciona: email del administrador y descripción del problema

---

## 🔒 POLÍTICAS DE SEGURIDAD

### Contraseñas
- Mínimo 6 caracteres (recomendado: 12+)
- Incluir mayúsculas, minúsculas y números
- No usar información personal
- Cambiar cada 3-6 meses

### Acceso
- Cada persona debe tener su propia cuenta
- No compartir credenciales
- Cerrar sesión al terminar
- Los tokens expiran cada 24 horas

---

**Fecha de creación:** 3 de Marzo 2026  
**Última actualización:** 3 de Marzo 2026  
**Estado:** ✅ Sistema funcional y seguro
