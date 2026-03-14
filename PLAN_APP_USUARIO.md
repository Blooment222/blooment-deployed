# 🚀 PLAN COMPLETO - APLICACIÓN DE USUARIO BLOOMENT

## 📋 ESTADO ACTUAL DEL PROYECTO

### ✅ LO QUE YA ESTÁ FUNCIONANDO (100% Completo):

#### 1. Backend REST API Completo
- **Base de datos:** PostgreSQL en Supabase
- **Modelos:** Usuario, Producto, Pedido, DetallePedido, Pago, Administrador
- **Endpoints CRUD funcionando:**
  - `/api/usuarios`
  - `/api/productos`
  - `/api/pedidos`
  - `/api/detalles-pedido`
  - `/api/pagos`
  - `/api/auth/*` (login, registro, verificación)
  - `/api/security/*` (gestión de admins)

#### 2. Panel de Administración Completo
- **URL:** https://petal-shop-api.preview.emergentagent.com/admin
- **Login:** admin@blooment.com / Blooment2025Secure!
- **Funcionalidades:**
  - ✅ Dashboard con estadísticas
  - ✅ Gestión de productos (CRUD visual)
  - ✅ Ajustes de seguridad
  - ✅ Cambiar contraseña con botones
  - ✅ Agregar/desactivar administradores
  - ✅ Sistema de autenticación con JWT
  - ✅ Protección de rutas

#### 3. Integraciones Configuradas
- **PostgreSQL:** Supabase conectado y funcionando
- **Prisma ORM:** Instalado y configurado
- **Gmail SMTP:** Configurado (pendiente de arreglar autenticación)
- **Stripe:** Instalado y claves configuradas

---

## 🎯 LO QUE HAY QUE CONSTRUIR (Aplicación de Usuario)

### Descripción del Proyecto:
Tienda online completa para venta de flores con diseño beige/blanco y fucsia.

### Diseño y UX:
- **Paleta de colores:**
  - Base: Beige/Blanco
  - Acentos: Fucsia/Rosa (color del logo)
  - Estilo: Minimalista y elegante

- **Logo:**
  - Siempre visible arriba al centro
  - Icono de flor rosa (Flower2 de Lucide)
  - Texto "Blooment"

- **Navegación principal:**
  - 🌸 Flores (catálogo)
  - 🎁 Ocasiones (bodas, cumpleaños, aniversarios)
  - 🏷️ Ofertas (productos en descuento)
  - 👤 Mi Cuenta (login/perfil/pedidos)

---

## 📱 ESTRUCTURA DE LA APLICACIÓN DE USUARIO

### Rutas y Páginas:

```
/tienda/                          # Homepage
├── layout.js                     # Layout con logo y navegación
├── page.js                       # Home - Catálogo de flores
├── flores/
│   └── [id]/
│       └── page.js               # Detalle de producto
├── ocasiones/
│   ├── page.js                   # Lista de ocasiones
│   └── [categoria]/
│       └── page.js               # Flores por ocasión
├── ofertas/
│   └── page.js                   # Productos en oferta
├── carrito/
│   └── page.js                   # Carrito de compras
├── checkout/
│   └── page.js                   # Proceso de pago
├── exito/
│   └── page.js                   # Confirmación de compra
├── login/
│   └── page.js                   # Login/Registro
└── cuenta/
    ├── page.js                   # Perfil de usuario
    └── pedidos/
        └── page.js               # Historial de pedidos
```

---

## 🔧 FUNCIONALIDADES A IMPLEMENTAR

### 1. Sistema de Autenticación de Clientes
**Modelo:** Tabla `clientes` (separada de usuarios/administradores)

```prisma
model Cliente {
  id        String   @id @default(uuid())
  nombre    String
  email     String   @unique
  password  String   // Hash con bcrypt
  telefono  String?
  direccion String?
  activo    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  pedidos Pedido[]
  
  @@map("clientes")
}
```

**Endpoints necesarios:**
- `POST /api/cliente/register` - Registro
- `POST /api/cliente/login` - Login
- `GET /api/cliente/me` - Perfil
- `PUT /api/cliente/perfil` - Actualizar perfil

### 2. Catálogo de Productos
**Features:**
- Grid de productos con fotos
- Filtros por precio, categoría
- Búsqueda
- Vista de detalle con:
  - Foto grande
  - Descripción completa
  - Precio
  - Stock disponible
  - Botón "Agregar al carrito"

### 3. Carrito de Compras
**Tecnología:** Context API de React

```javascript
// Estado del carrito
{
  items: [
    {
      productoId: "uuid",
      nombre: "Rosas Rojas",
      precio: 45.00,
      cantidad: 2,
      imagen_url: "..."
    }
  ],
  total: 90.00
}
```

**Funcionalidades:**
- Agregar productos
- Cambiar cantidad
- Eliminar productos
- Ver resumen
- Persistencia en localStorage
- Badge con cantidad en el header

### 4. Checkout con Stripe
**Flujo:**
1. Cliente revisa carrito
2. Ingresa/confirma datos de envío
3. Click en "Pagar"
4. Redirect a Stripe Checkout
5. Paga con tarjeta
6. Stripe redirige a página de éxito
7. Backend recibe webhook y actualiza pedido
8. Cliente ve confirmación y recibe email

**Endpoints necesarios:**
- `POST /api/checkout/create-session` - Crear sesión de Stripe
- `POST /api/checkout/webhook` - Webhook de Stripe
- `GET /api/checkout/status/:sessionId` - Verificar pago

### 5. Gestión de Pedidos
**Features:**
- Lista de pedidos del cliente
- Ver detalle de cada pedido:
  - Productos comprados
  - Total pagado
  - Estado (pendiente, pagado, enviado, entregado)
  - Fecha
  - Información de envío

### 6. Sistema de Ocasiones
**Categorías predefinidas:**
- Bodas
- Cumpleaños
- Aniversarios
- San Valentín
- Día de la Madre
- Condolencias
- Graduaciones

**Implementación:**
- Agregar campo `ocasion` a la tabla productos
- Filtrar productos por ocasión
- Página dedicada para cada ocasión

### 7. Sistema de Ofertas
**Features:**
- Agregar campos a productos:
  - `en_oferta` (boolean)
  - `precio_oferta` (decimal)
  - `porcentaje_descuento` (integer)
- Badge de "OFERTA" en productos
- Página dedicada de ofertas

---

## 🎨 DISEÑO DETALLADO

### Paleta de Colores:
```css
:root {
  /* Base */
  --bg-primary: #F5F5DC; /* Beige claro */
  --bg-secondary: #FFFFFF; /* Blanco */
  
  /* Acentos */
  --accent-primary: #EC4899; /* Fucsia (rosa del logo) */
  --accent-hover: #DB2777; /* Fucsia oscuro */
  
  /* Texto */
  --text-primary: #1F2937; /* Gris oscuro */
  --text-secondary: #6B7280; /* Gris medio */
  
  /* Bordes */
  --border-color: #E5E7EB;
}
```

### Componentes de UI:
1. **Header/Navbar:**
   - Logo centrado arriba
   - Navegación horizontal debajo del logo
   - Carrito en la esquina superior derecha
   - Usuario/Login en esquina superior derecha

2. **Product Card:**
   - Imagen cuadrada grande
   - Nombre del producto
   - Precio destacado
   - Badge de oferta si aplica
   - Hover con efecto sutil
   - Botón "Agregar"

3. **Botones:**
   - Primarios: Fucsia con hover más oscuro
   - Secundarios: Outline beige
   - Bordes redondeados suaves

4. **Footer:**
   - Información de contacto
   - Redes sociales
   - Políticas
   - Color beige oscuro

---

## 💳 INTEGRACIÓN DE STRIPE

### Configuración:
```env
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_51T72gXPgwMrJY054rb5WnsQHDWROohP8iNWbmSgD8V6uaDomIYyZyoIw4KuVCnJirEYzjrdyw5pH6bKi051mvsbf00nBfTG4gm"
STRIPE_SECRET_KEY="sk_test_51T72gXPgwMrJY054Un4K8875H7UTh70nsJ6D1WAY3Y5fA27uf98VUzmnNLpZB0wiH3MgPwDgMowOtXgNcyU57o6a00pRJPFKgG"
```

### Flujo de Pago:
1. Cliente hace checkout
2. Backend crea Stripe Checkout Session con:
   - Items del carrito
   - Precio total
   - URLs de éxito/cancelación
   - Metadata (clienteId, items)
3. Cliente es redirigido a Stripe
4. Stripe procesa el pago
5. Webhook notifica al backend
6. Backend crea el pedido en la BD
7. Backend envía email de confirmación
8. Cliente ve página de confirmación

---

## 📧 SISTEMA DE EMAILS

### Emails a implementar:

1. **Bienvenida al registrarse:**
   - Asunto: "¡Bienvenido a Blooment! 🌸"
   - Contenido: Gracias por registrarte, tu cuenta está lista

2. **Confirmación de pedido:**
   - Asunto: "Pedido #123 confirmado - Blooment"
   - Contenido: 
     - Resumen del pedido
     - Total pagado
     - Dirección de envío
     - Tiempo estimado de entrega

3. **Actualización de estado:**
   - Asunto: "Tu pedido #123 ha sido enviado"
   - Contenido: Número de seguimiento

### Destinatarios:
- **Cliente:** Confirmaciones y actualizaciones
- **Administrador (blooment@gmail.com):** Notificación de cada pedido nuevo

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### Nuevas tablas necesarias:

```prisma
// Tabla de clientes (usuarios de la tienda)
model Cliente {
  id        String   @id @default(uuid())
  nombre    String
  email     String   @unique
  password  String
  telefono  String?
  direccion String?
  activo    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  pedidos Pedido[]
  
  @@map("clientes")
}

// Tabla de sesiones de Stripe
model StripeSesion {
  id              String   @id @default(uuid())
  session_id      String   @unique
  cliente_id      String?
  cliente_email   String
  amount          Float
  currency        String   @default("eur")
  status          String   // pending, completed, expired, failed
  payment_status  String?
  items           Json     // Array de items del carrito
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("stripe_sesiones")
}
```

### Modificaciones a tablas existentes:

```prisma
// Agregar campos a Producto
model Producto {
  // ... campos existentes
  ocasion             String?  // boda, cumpleaños, etc
  en_oferta           Boolean  @default(false)
  precio_oferta       Float?
  porcentaje_descuento Int?
  categoria           String?  // rosas, tulipanes, orquídeas
}

// Modificar Pedido para incluir cliente
model Pedido {
  // ... campos existentes
  cliente_id  String?  // Nuevo campo
  cliente     Cliente? @relation(fields: [cliente_id], references: [id])
  
  // Datos de envío
  nombre_cliente      String
  email_cliente       String
  telefono_cliente    String
  direccion_envio     String
  
  // Stripe
  stripe_session_id   String?
}
```

---

## 📦 COMPONENTES REUTILIZABLES A CREAR

### Layout Components:
1. `ShopLayout.js` - Layout principal de la tienda
2. `ShopNavbar.js` - Navegación con logo y menú
3. `CartIcon.js` - Icono del carrito con badge
4. `Footer.js` - Footer de la tienda

### Product Components:
1. `ProductCard.js` - Card de producto
2. `ProductGrid.js` - Grid de productos
3. `ProductDetail.js` - Vista detallada
4. `AddToCartButton.js` - Botón agregar al carrito

### Cart Components:
1. `CartProvider.js` - Context del carrito
2. `CartItem.js` - Item en el carrito
3. `CartSummary.js` - Resumen del carrito
4. `CartDrawer.js` - Drawer del carrito (opcional)

### Checkout Components:
1. `CheckoutForm.js` - Formulario de datos
2. `OrderSummary.js` - Resumen del pedido
3. `StripeCheckout.js` - Integración con Stripe

### Auth Components:
1. `LoginForm.js` - Formulario de login
2. `RegisterForm.js` - Formulario de registro
3. `ClientAuthProvider.js` - Context de autenticación

---

## 🔐 SEGURIDAD

### Autenticación de Clientes:
- JWT tokens separados de los admins
- Tokens guardados en localStorage
- Expiración: 7 días
- Refresh automático

### Protección de Rutas:
- `/cuenta/*` requiere login
- `/checkout` requiere items en carrito
- Redirect automático al login

### Validaciones:
- Validación de email único
- Passwords mínimo 6 caracteres
- Validación de stock antes de agregar al carrito
- Verificar disponibilidad antes de checkout

---

## 📊 TESTING Y VALIDACIÓN

### Flujos a probar:
1. ✅ Registro de cliente nuevo
2. ✅ Login de cliente
3. ✅ Ver catálogo de productos
4. ✅ Agregar producto al carrito
5. ✅ Modificar cantidad en carrito
6. ✅ Eliminar del carrito
7. ✅ Proceso de checkout completo
8. ✅ Pago con Stripe (tarjeta de prueba)
9. ✅ Ver confirmación de pedido
10. ✅ Ver historial de pedidos
11. ✅ Recibir email de confirmación
12. ✅ Admin recibe notificación de pedido

### Tarjetas de Prueba Stripe:
- Éxito: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requiere autenticación: `4000 0025 0000 3155`

---

## 🚀 PLAN DE IMPLEMENTACIÓN (Orden recomendado)

### Fase 1: Base (30 min)
1. Crear estructura de carpetas `/tienda`
2. Crear layout con logo y navegación
3. Configurar colores y estilos globales
4. Crear componentes base

### Fase 2: Productos (45 min)
5. Página de catálogo con grid
6. Página de detalle de producto
7. Modificar tabla productos (ocasiones, ofertas)
8. Páginas de filtros (ocasiones, ofertas)

### Fase 3: Carrito (30 min)
9. Context del carrito
10. Agregar/quitar productos
11. Página del carrito
12. Persistencia en localStorage

### Fase 4: Autenticación (45 min)
13. Crear tabla clientes
14. Endpoints de registro/login
15. Páginas de login/registro
16. Context de autenticación
17. Protección de rutas

### Fase 5: Checkout y Stripe (60 min)
18. Página de checkout
19. Crear sesión de Stripe
20. Integración con Stripe Checkout
21. Webhook de Stripe
22. Tabla de sesiones de Stripe
23. Crear pedido después del pago

### Fase 6: Perfil y Pedidos (30 min)
24. Página de perfil
25. Página de historial de pedidos
26. Ver detalle de pedido

### Fase 7: Emails (30 min)
27. Email de bienvenida
28. Email de confirmación de pedido
29. Notificación al admin

### Fase 8: Polish (30 min)
30. Ajustes de diseño
31. Responsive design
32. Loading states
33. Error handling
34. Testing completo

**Tiempo total estimado: 4-5 horas**

---

## 📝 NOTAS IMPORTANTES PARA LA PRÓXIMA SESIÓN

### Credenciales y Accesos:

**Base de Datos:**
- PostgreSQL en Supabase
- Conectado y funcionando
- URL en `/app/.env`

**Admin Panel:**
- URL: https://petal-shop-api.preview.emergentagent.com/admin
- Email: admin@blooment.com
- Password: Blooment2025Secure!

**Stripe:**
- Modo Test activado
- Claves en `/app/.env`
- Webhook endpoint: `/api/checkout/webhook`

**Gmail:**
- Email: blooment@gmail.com
- Contraseña app: rlqc ecgy ssbc vxla
- (Nota: hay problema de autenticación, pendiente resolver)

### Archivos Clave:
- `/app/prisma/schema.prisma` - Modelos de BD
- `/app/app/api/[[...path]]/route.js` - API backend
- `/app/.env` - Variables de entorno
- `/app/lib/auth.js` - Funciones de autenticación
- `/app/lib/email.js` - Funciones de email

### Comandos Útiles:
```bash
# Ver administradores
node scripts/list-admins.js

# Cambiar contraseña
node scripts/change-password-quick.js <email> <password>

# Crear admin
node scripts/create-admin.js

# Generar cliente Prisma
npx prisma generate

# Crear migraciones
node scripts/create-tables.js
```

---

## ✅ CHECKLIST PARA EMPEZAR LA PRÓXIMA SESIÓN

Cosas a verificar antes de comenzar:

- [ ] Servidor Next.js corriendo
- [ ] Base de datos conectada
- [ ] Stripe configurado
- [ ] Al menos 2-3 productos en la base de datos (para probar)
- [ ] Admin panel funcionando

Cosas a tener a mano:
- [ ] Tarjeta de prueba de Stripe: 4242 4242 4242 4242
- [ ] Credenciales de admin
- [ ] Este documento de planificación

---

## 🎯 OBJETIVO FINAL

Una aplicación de e-commerce completa y funcional donde:

1. ✅ Los clientes pueden ver el catálogo de flores
2. ✅ Pueden registrarse y hacer login
3. ✅ Pueden agregar productos al carrito
4. ✅ Pueden pagar con tarjeta (Stripe)
5. ✅ Reciben confirmación por email
6. ✅ Pueden ver su historial de pedidos
7. ✅ El diseño es beige/blanco con fucsia
8. ✅ El logo está siempre visible
9. ✅ La navegación es intuitiva
10. ✅ Todo funciona en móvil y desktop

---

**Fecha de creación:** 3 de Marzo 2026  
**Estado:** Listo para comenzar implementación  
**Prioridad:** Alta  
**Complejidad:** Media-Alta
