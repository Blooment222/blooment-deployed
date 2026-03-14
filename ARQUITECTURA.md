# 🏗️ Arquitectura del Proyecto Blooment

## 📊 Visión General

```
┌─────────────────────────────────────────────────────────────┐
│                     BLOOMENT - Plataforma Completa          │
│                     Venta de Flores Online                  │
└─────────────────────────────────────────────────────────────┘

                            ▼

┌─────────────────────────────────────────────────────────────┐
│                    MONOLITO MODULAR                         │
│              (Todo en un mismo proyecto Next.js)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   ADMIN      │  │   TIENDA     │  │   BACKEND API   │ │
│  │   Panel      │  │   (Usuario)  │  │   REST          │ │
│  │   ✅ LISTO    │  │   📋 FUTURO  │  │   ✅ LISTO      │ │
│  └──────────────┘  └──────────────┘  └─────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘

                            ▼

┌─────────────────────────────────────────────────────────────┐
│                     BASE DE DATOS                           │
│                  PostgreSQL (Supabase)                      │
│                        ✅ LISTO                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Estructura de Carpetas

```
/app/
│
├── 📄 package.json                    # Dependencias del proyecto
├── 📄 .env                            # Variables de entorno
│
├── 📁 app/                            # Aplicación Next.js
│   │
│   ├── 📄 page.js                     # Landing → Redirige a /admin
│   ├── 📄 layout.js                   # Layout raíz
│   ├── 📄 globals.css                 # Estilos globales
│   │
│   ├── 📁 admin/                      # ✅ PANEL DE ADMIN
│   │   ├── 📄 layout.js               # Layout con sidebar
│   │   ├── 📄 page.js                 # Dashboard
│   │   ├── 📁 productos/
│   │   │   └── 📄 page.js             # CRUD Productos ✅
│   │   ├── 📁 pedidos/
│   │   │   └── 📄 page.js             # Gestión Pedidos 📋
│   │   ├── 📁 clientes/
│   │   │   └── 📄 page.js             # Gestión Clientes 📋
│   │   └── 📁 pagos/
│   │       └── 📄 page.js             # Gestión Pagos 📋
│   │
│   ├── 📁 tienda/                     # 📋 APP DE USUARIO (FUTURO)
│   │   └── 📄 page.js                 # Placeholder
│   │
│   └── 📁 api/                        # ✅ BACKEND REST
│       └── 📁 [[...path]]/
│           └── 📄 route.js            # Todos los endpoints
│
├── 📁 components/                     # Componentes Shadcn
│   └── 📁 ui/                         # Button, Card, Dialog, etc.
│
├── 📁 lib/                            # Librerías y utils
│   ├── 📄 prisma.js                   # Cliente Prisma
│   └── 📄 utils.js                    # Utilidades
│
├── 📁 prisma/                         # Configuración DB
│   └── 📄 schema.prisma               # Esquema de la base de datos
│
└── 📁 scripts/                        # Scripts auxiliares
    ├── 📄 test-db.js                  # Test de conexión
    └── 📄 create-tables.js            # Crear tablas
```

---

## 🎯 Módulos del Sistema

### 1. ✅ Backend API (Completo)

**Ubicación:** `/app/api/[[...path]]/route.js`

**Endpoints Implementados:**
```
📦 Usuarios
  GET    /api/usuarios           # Listar
  GET    /api/usuarios/:id       # Ver uno
  POST   /api/usuarios           # Crear
  PUT    /api/usuarios/:id       # Actualizar
  DELETE /api/usuarios/:id       # Eliminar

🌸 Productos
  GET    /api/productos          # Listar
  GET    /api/productos/:id      # Ver uno
  POST   /api/productos          # Crear
  PUT    /api/productos/:id      # Actualizar
  DELETE /api/productos/:id      # Eliminar

🛒 Pedidos
  GET    /api/pedidos            # Listar
  GET    /api/pedidos/:id        # Ver uno
  POST   /api/pedidos            # Crear (con detalles)
  PUT    /api/pedidos/:id        # Actualizar
  DELETE /api/pedidos/:id        # Eliminar

📝 Detalles Pedido
  GET    /api/detalles-pedido    # Listar
  GET    /api/detalles-pedido/:id # Ver uno
  POST   /api/detalles-pedido    # Crear
  PUT    /api/detalles-pedido/:id # Actualizar
  DELETE /api/detalles-pedido/:id # Eliminar

💳 Pagos
  GET    /api/pagos              # Listar
  GET    /api/pagos/:id          # Ver uno
  POST   /api/pagos              # Crear
  PUT    /api/pagos/:id          # Actualizar
  DELETE /api/pagos/:id          # Eliminar
```

**Tecnologías:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL

---

### 2. ✅ Panel de Administrador (Completo)

**Ubicación:** `/app/admin/`

**Rutas:**
```
/admin                      # Dashboard
/admin/productos            # Gestión de Productos ✅
/admin/pedidos              # Gestión de Pedidos 📋
/admin/clientes             # Gestión de Clientes 📋
/admin/pagos                # Gestión de Pagos 📋
```

**Funcionalidades Actuales:**

#### Dashboard (`/admin`)
- ✅ Total de productos
- ✅ Valor del inventario
- ✅ Productos con stock bajo
- ✅ Total de pedidos
- ✅ Acciones rápidas

#### Productos (`/admin/productos`)
- ✅ Ver todos los productos en tabla
- ✅ Buscar productos
- ✅ Agregar nuevo producto
- ✅ Editar producto
- ✅ Eliminar producto
- ✅ Notificaciones (toast)

**Tecnologías:**
- Next.js App Router
- React 18
- Tailwind CSS
- Shadcn/ui
- Lucide Icons

---

### 3. 📋 App de Usuario (Futuro)

**Ubicación:** `/app/tienda/`

**Rutas Propuestas:**
```
/tienda                     # Home/Catálogo
/tienda/producto/:id        # Detalle de producto
/tienda/carrito             # Carrito de compras
/tienda/checkout            # Proceso de pago
/tienda/cuenta              # Cuenta del usuario
/tienda/mis-pedidos         # Historial de pedidos
```

**Funcionalidades Propuestas:**
- Ver catálogo de flores
- Filtrar por precio, tipo, etc.
- Agregar al carrito
- Proceso de checkout
- Crear cuenta / Login
- Ver historial de compras
- Rastrear pedidos

---

## 🗄️ Base de Datos

**PostgreSQL en Supabase**

### Modelos y Relaciones:

```
┌─────────────┐         ┌─────────────┐
│   USUARIO   │────┐    │  PRODUCTO   │
│             │    │    │             │
│ - id        │    │    │ - id        │
│ - nombre    │    │    │ - nombre    │
│ - email     │    │    │ - precio    │
│ - telefono  │    │    │ - stock     │
│ - direccion │    │    │ - imagen    │
└─────────────┘    │    └─────────────┘
       │           │           │
       │           │           │
       │ 1     N   ▼           │ 1
       └────────┌──────────┐   │
                │  PEDIDO  │   │
                │          │   │
                │ - id     │   │
                │ - total  │   │
                │ - estado │   │
                │ - fecha  │   │
                └──────────┘   │
                    │  │       │
         ┌──────────┘  └───────┼──────┐
         │ 1                N  │      │ 1
         │                     │      │
         ▼ N               ┌───▼──────▼─────┐
    ┌─────────┐           │ DETALLE_PEDIDO │
    │  PAGO   │           │                │
    │         │           │ - cantidad     │
    │ - monto │           │ - precio_unit  │
    │ - estado│           │ - subtotal     │
    └─────────┘           └────────────────┘
```

**Relaciones CASCADE:**
- Usuario → Pedidos (eliminar usuario elimina sus pedidos)
- Usuario → Pagos (eliminar usuario elimina sus pagos)
- Pedido → Detalles (eliminar pedido elimina los detalles)
- Pedido → Pagos (eliminar pedido elimina los pagos)

**Relaciones RESTRICT:**
- Producto → Detalles (no se puede eliminar un producto con pedidos asociados)

---

## 🔄 Flujo de Datos

### Admin Panel - Gestión de Productos

```
┌──────────────┐
│   NAVEGADOR  │
│  (Admin UI)  │
└──────┬───────┘
       │ 1. Clic "Agregar Producto"
       ▼
┌──────────────┐
│  React Form  │
│  Validación  │
└──────┬───────┘
       │ 2. POST /api/productos
       ▼
┌──────────────┐
│ API Route    │
│ route.js     │
└──────┬───────┘
       │ 3. prisma.producto.create()
       ▼
┌──────────────┐
│ Prisma ORM   │
└──────┬───────┘
       │ 4. INSERT INTO productos
       ▼
┌──────────────┐
│  PostgreSQL  │
│  (Supabase)  │
└──────┬───────┘
       │ 5. Return producto
       ▼
┌──────────────┐
│  React UI    │
│  Actualiza   │
│  + Toast ✅  │
└──────────────┘
```

---

## 🔐 Separación de Responsabilidades

### Módulo Admin (`/admin/*`)
**Propósito:** Gestión interna del negocio
- Dashboard con métricas
- CRUD de productos
- Gestión de pedidos
- Gestión de clientes

### Módulo Tienda (`/tienda/*`)
**Propósito:** Experiencia del cliente
- Catálogo público
- Carrito de compras
- Proceso de compra
- Cuenta de usuario

### Módulo API (`/api/*`)
**Propósito:** Lógica de negocio compartida
- Endpoints REST
- Validaciones
- Acceso a base de datos
- Respuestas JSON

**Ventaja:** Ambos módulos (Admin y Tienda) usan la misma API, evitando duplicación de código.

---

## 🎨 Stack Tecnológico Completo

### Frontend
- **Framework:** Next.js 14.2.3
- **React:** 18
- **Styling:** Tailwind CSS 3.4
- **UI Library:** Shadcn/ui + Radix UI
- **Icons:** Lucide React
- **State:** React Hooks

### Backend
- **API:** Next.js API Routes
- **ORM:** Prisma 5.22.0
- **Validation:** Manual + Prisma

### Database
- **DBMS:** PostgreSQL 15+
- **Hosting:** Supabase
- **Connection:** Transaction Pooler (port 6543)

### DevOps
- **Package Manager:** Yarn 1.22.22
- **Node:** v18+
- **Deploy:** Emergent Preview Environment

---

## 🚀 Deploy y URLs

### Producción Actual
```
https://petal-shop-api.preview.emergentagent.com

├── /                         # Home (redirige a /admin)
├── /admin                    # Panel de Admin ✅
├── /admin/productos          # Productos ✅
├── /api/*                    # Backend REST ✅
└── /tienda                   # App Usuario 📋
```

---

## 📈 Escalabilidad Futura

### Sin Conflictos
La arquitectura actual permite crecer sin problemas:

1. **Agregar nueva ruta admin:**
   ```
   /app/admin/reportes/page.js
   ```

2. **Agregar nueva ruta tienda:**
   ```
   /app/tienda/ofertas/page.js
   ```

3. **Agregar nuevo endpoint:**
   ```javascript
   // En /app/api/[[...path]]/route.js
   if (route === '/categorias' && method === 'GET') {
     // Lógica aquí
   }
   ```

### Microservicios (Futuro Lejano)
Si el proyecto crece mucho, se puede migrar a:
- Admin Panel → Aplicación separada
- Tienda → Aplicación separada
- Backend → API separada
- Todo comunicándose vía API REST

---

## 🎯 Estado del Proyecto

```
Backend API:         ████████████████████ 100% ✅
Panel Admin:         ████████████░░░░░░░░ 60%  ✅ (Dashboard + Productos)
App Usuario:         ░░░░░░░░░░░░░░░░░░░░ 0%   📋
Base de Datos:       ████████████████████ 100% ✅
Documentación:       ████████████████████ 100% ✅
```

---

## 📋 Próximos Pasos Recomendados

### Inmediato (Admin Panel)
1. ✅ Completar gestión de pedidos
2. ✅ Completar gestión de clientes
3. ✅ Completar gestión de pagos
4. ✅ Agregar gráficos al dashboard

### Siguiente Fase (App Usuario)
1. Crear catálogo público
2. Implementar carrito
3. Sistema de checkout
4. Autenticación de usuarios

---

**Blooment está construido sobre una arquitectura sólida, modular y escalable. Listo para crecer sin límites.** 🌸🚀
