# Blooment - E-commerce de Flores 🌺

Aplicación completa de comercio electrónico para venta de flores y arreglos florales, construida con Next.js 14, PostgreSQL (Supabase) y Prisma.

## 🚀 Stack Tecnológico

- **Frontend:** Next.js 14 (App Router), React 18, TailwindCSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Base de Datos:** PostgreSQL (Supabase) con Prisma ORM
- **Autenticación:** JWT + Google OAuth
- **Mapas:** Mapbox Geocoding API (autocompletado de direcciones)
- **Emails:** Resend
- **Notificaciones Push:** OneSignal
- **Pagos:** Preparado para Stripe/PayPal

## 📋 Características Principales

### Para Clientes:
- ✅ Catálogo de productos con imágenes
- ✅ Carrito de compras persistente
- ✅ Checkout con autocompletado de direcciones (Mapbox)
- ✅ Selección de contactos favoritos o nuevos destinatarios
- ✅ Gestión de contactos favoritos con fechas especiales
- ✅ Historial de pedidos
- ✅ Autenticación con Google OAuth

### Para Administradores:
- ✅ Panel de administración completo
- ✅ Gestión de productos (CRUD)
- ✅ Gestión de pedidos con estados
- ✅ Visualización de clientes
- ✅ Sistema de notificaciones push
- ✅ Dashboard con métricas

## 🔧 Configuración Inicial

### 1. Clonar el Repositorio

```bash
git clone https://github.com/TU_USUARIO/blooment.git
cd blooment
```

### 2. Instalar Dependencias

```bash
yarn install
```

### 3. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` y completa las variables:

```bash
cp .env.example .env
```

#### Variables Requeridas:

**Base de Datos (Supabase PostgreSQL):**
```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

**Autenticación:**
```env
JWT_SECRET="tu_secreto_super_seguro_aqui"
GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret"
```

**Servicios Externos:**
```env
RESEND_API_KEY="re_..."
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="pk...."
ONESIGNAL_APP_ID="tu-app-id"
ONESIGNAL_API_KEY="tu-api-key"
```

### 4. Configurar Base de Datos

```bash
# Generar cliente de Prisma
npx prisma generate

# Crear tablas en la base de datos
npx prisma db push

# (Opcional) Poblar con datos de ejemplo
npx prisma db seed
```

### 5. Ejecutar en Desarrollo

```bash
yarn dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
blooment/
├── app/                          # Next.js App Router
│   ├── admin/                   # Panel de administración
│   │   ├── pedidos/            # Gestión de pedidos
│   │   ├── productos/          # Gestión de productos
│   │   └── notificaciones/     # Sistema de notificaciones
│   ├── tienda/                 # Frontend de la tienda
│   │   ├── cuenta/             # Perfil y contactos favoritos
│   │   ├── carrito/            # Carrito de compras
│   │   ├── detalles-entrega/  # Checkout
│   │   └── pedidos/            # Historial de pedidos
│   ├── api/                    # API Routes
│   │   └── [[...path]]/        # API monolítica
│   ├── layout.js               # Layout principal
│   └── page.js                 # Homepage
├── components/                  # Componentes React
│   ├── ui/                     # shadcn/ui components
│   ├── MapboxAutocomplete.js   # Autocompletado de direcciones
│   └── TiendaLayoutWrapper.js  # Layout de tienda
├── lib/                         # Utilidades
│   ├── cliente-auth.js         # Context de autenticación
│   ├── carrito-context.js      # Context del carrito
│   └── utils.js                # Funciones auxiliares
├── prisma/                      # Base de datos
│   └── schema.prisma           # Schema de Prisma
├── public/                      # Assets estáticos
├── scripts/                     # Scripts de utilidad
├── .env.example                # Variables de entorno (template)
├── .gitignore                  # Archivos ignorados por Git
├── package.json                # Dependencias
├── tailwind.config.js          # Configuración de Tailwind
└── README.md                   # Este archivo
```

## 🗄️ Schema de Base de Datos

### Tablas Principales:

- **Administradores:** Usuarios del panel de administración
- **Clientes:** Usuarios de la tienda (con OAuth)
- **Productos:** Catálogo de flores y arreglos
- **Pedidos:** Órdenes de compra
- **PedidoItem:** Items de cada pedido
- **ContactoFavorito:** Destinatarios frecuentes de clientes
- **FechaEspecial:** Fechas importantes (cumpleaños, aniversarios)

## 🚀 Despliegue en Vercel

### 1. Conecta tu Repositorio

- Ve a [vercel.com](https://vercel.com)
- Click en "New Project"
- Importa tu repositorio de GitHub

### 2. Configura Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables, agrega todas las variables de `.env`

### 3. Configura el Build

Vercel detectará automáticamente Next.js. Configuración por defecto:

- **Framework Preset:** Next.js
- **Build Command:** `yarn build`
- **Output Directory:** `.next`

### 4. Dominio Personalizado

Settings → Domains → Add Domain: `blooment.mx`

Configura los registros DNS:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## 🔐 Credenciales de Administrador

**Email:** `admin@blooment.com`  
**Password:** `Blooment222.`

⚠️ **IMPORTANTE:** Cambia estas credenciales inmediatamente en producción.

## 📧 Configuración de Servicios Externos

### Resend (Emails)
1. Crea cuenta en [resend.com](https://resend.com)
2. Verifica tu dominio
3. Copia tu API Key

### Mapbox (Mapas)
1. Crea cuenta en [mapbox.com](https://mapbox.com)
2. Crea un Access Token
3. Copia el token público

### OneSignal (Notificaciones Push)
1. Crea cuenta en [onesignal.com](https://onesignal.com)
2. Crea una app web
3. Copia App ID y API Key

### Google OAuth
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto
3. Habilita Google+ API
4. Crea credenciales OAuth 2.0
5. Authorized redirect URIs: `https://tu-dominio.com/api/auth/google/callback`

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
yarn dev

# Producción
yarn build
yarn start

# Prisma
npx prisma studio        # Interfaz visual de BD
npx prisma migrate dev   # Crear migración
npx prisma db push       # Sincronizar schema
npx prisma generate      # Generar cliente

# Testing
yarn lint               # Linter
```

## 📝 Notas Importantes

### Migración desde Cuenta Anterior

Este proyecto fue migrado de una cuenta anterior de Supabase. La nueva configuración es:

- **Proyecto:** `bknhaqfpwmnxxsdluqtv`
- **Región:** `us-west-2`
- **Datos migrados:** ✅ Administradores, Clientes, Productos, Contactos, Pedidos

### Mapbox vs Google Maps

La aplicación usa **Mapbox** para el autocompletado de direcciones (no Google Maps). Esto evita problemas de SSR y es más económico.

### Sistema de Contactos Favoritos

Los clientes pueden guardar destinatarios frecuentes con fechas especiales. El sistema envía recordatorios automáticos vía email.

## 🐛 Troubleshooting

### Error: "Can't reach database server"
- Verifica que DATABASE_URL y DIRECT_URL sean correctas
- Asegúrate de que Supabase permita conexiones desde tu IP

### Mapbox no muestra sugerencias
- Verifica que NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN sea válido
- Abre la consola del navegador para ver errores

### Google OAuth falla
- Verifica redirect URIs en Google Console
- Asegúrate de que GOOGLE_CLIENT_ID y SECRET sean correctos

## 📄 Licencia

Propietario: Diego Hernández (diegoah1107@gmail.com)  
Todos los derechos reservados.

## 🆘 Soporte

Para preguntas o problemas:
- Email: diegoah1107@gmail.com
- GitHub Issues: Abre un issue en el repositorio

---

Desarrollado con ❤️ para Blooment
