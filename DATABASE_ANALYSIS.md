# 🔍 ANÁLISIS DE BASE DE DATOS - BLOOMENT APP

**Fecha de Análisis:** 9 de Marzo, 2026

---

## 📊 **CONCLUSIÓN: LA APP USA POSTGRESQL (SUPABASE)**

### **Evidencia Encontrada:**

1. **Prisma Schema configurado para PostgreSQL:**
   - Archivo: `/app/prisma/schema.prisma`
   - Línea 9: `provider = "postgresql"`
   - DATABASE_URL apunta a Supabase PostgreSQL

2. **Variables de Entorno (.env):**
   ```env
   MONGO_URL=mongodb://localhost:27017  ← NO SE USA
   DATABASE_URL="postgresql://postgres.uxhqkofbxywmchgnhffu:...@aws-1-us-east-1.pooler.supabase.com:6543/postgres"  ← SE USA
   ```

3. **Código usa Prisma Client:**
   - Todos los archivos del API importan: `import prisma from '@/lib/prisma'`
   - Ejemplos encontrados:
     - `/app/api/clientes/login/route.js` → `prisma.cliente.findUnique()`
     - `/app/api/admin/cupones/route.js` → `prisma.cupon.findMany()`
     - Múltiples endpoints usan Prisma

4. **Package.json:**
   - Dependencia: `"@prisma/client": "^5.22.0"`
   - NO hay dependencias de MongoDB (mongoose, mongodb driver, etc.)

5. **MONGO_URL presente pero NO utilizado:**
   - La variable existe en `.env` (probablemente vestigio del template original)
   - NO hay código que use MongoDB directamente
   - NO hay imports de mongoose o MongoClient

---

## 🎯 **BASE DE DATOS ACTUAL**

**✅ PostgreSQL (Supabase)**
- Host: `aws-1-us-east-1.pooler.supabase.com`
- Puerto: `6543`
- Conexión Pool: PgBouncer
- Connection Limit: 1

**❌ MongoDB**
- Variable definida pero NO utilizada
- NO hay código que lo use
- Reliquia del template inicial

---

## 🚨 **BLOCKER CRÍTICO PARA DEPLOYMENT EN EMERGENT**

### **Problema:**
Emergent proporciona **SOLO MongoDB gestionado**, pero tu app usa **PostgreSQL externo (Supabase)**.

### **¿Por qué es un blocker?**
1. La app intentará conectarse a Supabase desde el cluster de Kubernetes de Emergent
2. Si Supabase está configurado con restricciones de red/IP, la conexión fallará
3. No hay MongoDB configurado que la app pueda usar como fallback

---

## 💡 **SOLUCIONES DISPONIBLES**

### **Opción 1: CONTINUAR CON SUPABASE (Recomendada si ya tienes datos)**

**Ventajas:**
- ✅ No requiere migración de datos
- ✅ Supabase es un servicio robusto y escalable
- ✅ Mantienes todas las features de PostgreSQL

**Requisitos:**
1. **Verificar conectividad externa:**
   - Confirmar que Supabase permite conexiones desde cualquier IP
   - O configurar las IPs de Emergent en el whitelist de Supabase
   
2. **Asegurar credenciales en Emergent:**
   - Las variables `DATABASE_URL` y `DIRECT_URL` deben estar en los secrets de Emergent
   
3. **Optimizar queries (CRÍTICO):**
   - Agregar `LIMIT` a queries sin límite
   - Implementar paginación en endpoints pesados
   
**Pasos para deployar:**
```bash
1. Agregar LIMIT a queries en /app/api/[[...path]]/route.js
2. Implementar paginación en endpoints de productos y pedidos
3. Verificar que DATABASE_URL esté en los secretos de deployment
4. Deployar
```

---

### **Opción 2: MIGRAR A MONGODB (Trabajo intensivo)**

**Solo recomendada si:**
- No tienes muchos datos en producción
- Quieres usar el MongoDB gestionado de Emergent
- Prefieres evitar dependencias externas

**Trabajo requerido:**
1. ❌ Actualizar Prisma schema de `postgresql` a `mongodb`
2. ❌ Modificar todos los modelos (IDs, relaciones)
3. ❌ Reescribir queries complejas (Prisma con MongoDB es diferente)
4. ❌ Migrar datos de PostgreSQL a MongoDB
5. ❌ Probar TODA la aplicación
6. ❌ Manejar diferencias (transacciones, joins, etc.)

**Estimación:** 4-6 horas de trabajo + testing extensivo

---

## 📋 **RECOMENDACIÓN FINAL**

### **✅ OPCIÓN 1: MANTENER SUPABASE POSTGRESQL**

**Razones:**
1. **Menor riesgo:** Tu app ya funciona con PostgreSQL
2. **Menor esfuerzo:** Solo requiere optimizaciones de queries
3. **Más rápido:** Puedes deployar hoy después de optimizar
4. **PostgreSQL es superior:** Para aplicaciones transaccionales como e-commerce

**Próximos pasos inmediatos:**
1. ✅ Confirmar que Supabase permite conexiones externas
2. ✅ Optimizar queries sin límite (agregar paginación)
3. ✅ Verificar credenciales en deployment
4. ✅ Deployar

---

## 🔧 **QUERIES QUE NECESITAN OPTIMIZACIÓN**

### **1. API de Productos**
```javascript
// ❌ ANTES (carga TODO el inventario)
const productos = await prisma.$queryRaw`SELECT * FROM productos ORDER BY "createdAt" DESC`

// ✅ DESPUÉS (con límite)
const productos = await prisma.$queryRaw`SELECT * FROM productos ORDER BY "createdAt" DESC LIMIT 100`
```

### **2. API de Pedidos (Cliente)**
```javascript
// ❌ ANTES
const pedidos = await prisma.pedido.findMany({
  include: { usuario: true, detallesPedido: { include: { producto: true } } }
})

// ✅ DESPUÉS
const pedidos = await prisma.pedido.findMany({
  take: 50,
  skip: page * 50,
  include: { usuario: true, detallesPedido: { include: { producto: true } } }
})
```

### **3. API de Pedidos (Admin)**
```javascript
// ❌ ANTES
const pedidos = await prisma.pedido.findMany({
  include: { cliente: true, detallesPedido: { include: { producto: true } } }
})

// ✅ DESPUÉS
const pedidos = await prisma.pedido.findMany({
  take: 100,
  skip: offset,
  include: { cliente: true, detallesPedido: { include: { producto: true } } }
})
```

---

## ✅ **CHECKLIST PARA DEPLOYMENT**

- [ ] Confirmar conectividad de Supabase desde Emergent
- [ ] Agregar paginación a queries de productos
- [ ] Agregar paginación a queries de pedidos
- [ ] Verificar que DATABASE_URL esté en secretos
- [ ] Remover MONGO_URL del .env (no se usa)
- [ ] Probar la app localmente con queries optimizadas
- [ ] Deployar a Emergent

---

**CONCLUSIÓN:** Tu app usa PostgreSQL de Supabase. La mejor estrategia es mantenerlo y optimizar las queries para deployment.
