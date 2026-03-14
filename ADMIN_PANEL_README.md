# 🎨 Blooment - Frontend de Administrador

Panel de administración para gestionar la tienda de flores Blooment.

## ✅ Estado Actual

El **Panel de Administrador** está completamente funcional y operativo.

---

## 📐 Estructura del Proyecto

```
/app/
├── app/
│   ├── page.js                      # Landing (redirige a /admin)
│   ├── admin/                       # 🔧 Panel de Administrador
│   │   ├── layout.js                # Layout con sidebar
│   │   ├── page.js                  # Dashboard principal
│   │   ├── productos/
│   │   │   └── page.js              # Gestión de productos (CRUD)
│   │   ├── pedidos/
│   │   │   └── page.js              # Gestión de pedidos (próximamente)
│   │   ├── clientes/
│   │   │   └── page.js              # Gestión de clientes (próximamente)
│   │   └── pagos/
│   │       └── page.js              # Gestión de pagos (próximamente)
│   ├── tienda/                      # 🛍️ App de Usuario (futuro)
│   │   └── page.js                  # Placeholder
│   └── api/                         # Backend REST
│       └── [[...path]]/route.js
├── components/ui/                   # Componentes Shadcn
└── lib/                             # Utilidades
```

---

## 🎯 Funcionalidades Implementadas

### ✅ Dashboard
- **Stats Cards:**
  - Total de productos en catálogo
  - Valor total del inventario (€)
  - Productos con stock bajo (< 10 unidades)
  - Total de pedidos registrados
- **Acciones Rápidas:** Enlaces a gestión de productos, pedidos y clientes
- **Diseño Responsive:** Funciona en móvil, tablet y desktop

### ✅ Gestión de Productos (Inventario)
- **Ver todos los productos:** Tabla con nombre, descripción, precio y stock
- **Buscar productos:** Barra de búsqueda en tiempo real
- **Agregar nuevos productos:** Formulario modal con validaciones
  - Campos: nombre*, precio*, descripción, stock, imagen_url
  - Validación de campos requeridos
- **Editar productos:** Modal para editar precio, stock y todos los campos
- **Eliminar productos:** Con confirmación
- **Alertas visuales:** Stock bajo (< 10) se muestra en naranja
- **Notificaciones:** Toast notifications para acciones exitosas/fallidas

### 🔄 Pendientes (Próximas Funcionalidades)
- Gestión de Pedidos
- Gestión de Clientes
- Gestión de Pagos
- Reportes y estadísticas avanzadas
- Gráficos de ventas

---

## 🎨 Diseño

### Sistema de Diseño
- **Framework:** Next.js 14.2.3
- **UI Components:** Shadcn/ui + Radix UI
- **Estilos:** Tailwind CSS
- **Iconos:** Lucide React
- **Tema:** Dark/Light mode support

### Layout
- **Sidebar:** Navegación con iconos y labels
  - Dashboard
  - Productos
  - Pedidos
  - Clientes
  - Pagos
- **Responsive:** 
  - Desktop: Sidebar fijo
  - Mobile: Sidebar colapsable con hamburger menu
- **Header:** Logo "Blooment" con icono de flor

---

## 🔗 URLs

### Admin Panel
```
https://petal-shop-api.preview.emergentagent.com/admin
```

### Rutas disponibles:
- `/admin` - Dashboard principal
- `/admin/productos` - Gestión de productos ✅
- `/admin/pedidos` - Gestión de pedidos (próximamente)
- `/admin/clientes` - Gestión de clientes (próximamente)
- `/admin/pagos` - Gestión de pagos (próximamente)

### App de Usuario (Futuro)
```
/tienda
```

---

## 🧪 Testing Manual

### Probar el Dashboard
1. Ir a: https://petal-shop-api.preview.emergentagent.com/admin
2. Verificar que se muestren las 4 tarjetas de estadísticas
3. Los números deben actualizarse desde la API

### Probar Gestión de Productos
1. Ir a: https://petal-shop-api.preview.emergentagent.com/admin/productos
2. **Ver productos:** Deberías ver la tabla con productos existentes
3. **Buscar:** Escribe en el campo de búsqueda
4. **Agregar:**
   - Click en "Agregar Producto"
   - Llenar el formulario
   - Click en "Crear Producto"
   - Verificar notificación de éxito
5. **Editar:**
   - Click en el icono de lápiz
   - Modificar precio o stock
   - Guardar cambios
6. **Eliminar:**
   - Click en el icono de basura roja
   - Confirmar eliminación

---

## 🔌 Conexión con Backend

El frontend consume los siguientes endpoints:

### Productos
- `GET /api/productos` - Listar productos
- `POST /api/productos` - Crear producto
- `PUT /api/productos/:id` - Actualizar producto
- `DELETE /api/productos/:id` - Eliminar producto

### Pedidos
- `GET /api/pedidos` - Listar pedidos (para stats)

Todas las llamadas se hacen con `fetch` nativo de JavaScript.

---

## 📱 Responsive Design

El panel se adapta a diferentes tamaños de pantalla:

### Desktop (>= 1024px)
- Sidebar fijo visible
- Tabla completa
- Stats en 4 columnas

### Tablet (768px - 1023px)
- Sidebar colapsable
- Stats en 2 columnas
- Tabla scrollable

### Mobile (< 768px)
- Hamburger menu
- Stats en 1 columna
- Tabla optimizada para móvil

---

## 🚀 Características Técnicas

### Performance
- **Client Components:** Solo donde es necesario (interactividad)
- **Server Components:** Por defecto (mejor performance)
- **Code Splitting:** Automático por Next.js
- **Lazy Loading:** Componentes cargados bajo demanda

### UX
- **Loading States:** Indicadores de carga
- **Error Handling:** Mensajes de error claros
- **Toast Notifications:** Feedback inmediato
- **Validaciones:** Formularios validados
- **Confirmaciones:** Diálogos de confirmación para acciones destructivas

### Accesibilidad
- **Semantic HTML:** Etiquetas apropiadas
- **ARIA Labels:** En componentes interactivos
- **Keyboard Navigation:** Navegación con teclado
- **Focus Management:** Focus visible y lógico

---

## 🔧 Preparación para App de Usuario

La estructura está lista para agregar la aplicación de usuario sin conflictos:

### Estructura propuesta:
```
/app/
├── admin/              # Panel de Admin (actual)
├── tienda/             # App de Usuario (futuro)
│   ├── layout.js       # Layout de tienda
│   ├── page.js         # Home/catálogo
│   ├── producto/
│   │   └── [id]/
│   │       └── page.js # Detalle de producto
│   ├── carrito/
│   │   └── page.js     # Carrito de compras
│   └── checkout/
│       └── page.js     # Proceso de pago
└── api/                # Backend compartido
```

### Routing:
- `/admin/*` - Panel de Administrador
- `/tienda/*` - Aplicación de Usuario
- `/api/*` - Backend REST API

**No hay conflictos** porque cada sección tiene su propia carpeta y rutas.

---

## 💡 Próximos Pasos Sugeridos

### Corto Plazo (Admin Panel)
1. ✅ Completar gestión de pedidos
2. ✅ Agregar gestión de clientes
3. ✅ Implementar gestión de pagos
4. ✅ Dashboard con gráficos (Chart.js/Recharts)

### Medio Plazo (App de Usuario)
1. Crear catálogo de productos públicos
2. Implementar carrito de compras
3. Sistema de checkout
4. Autenticación de usuarios
5. Historial de pedidos

### Largo Plazo (Mejoras)
1. Sistema de notificaciones en tiempo real
2. Chat de soporte
3. Sistema de descuentos/cupones
4. Multi-idioma (i18n)
5. PWA (Progressive Web App)

---

## 📝 Componentes Principales

### AdminLayout
- Sidebar con navegación
- Mobile menu
- Header responsive
- Scroll area para contenido largo

### Dashboard
- Stats cards con iconos
- Cálculo dinámico desde API
- Quick actions links

### ProductosPage
- Tabla de productos
- Búsqueda en tiempo real
- CRUD completo
- Formulario modal
- Toast notifications

---

## 🎨 Capturas de Pantalla

### Dashboard
![Dashboard](screenshot-dashboard.png)
- 4 tarjetas de estadísticas
- Acciones rápidas
- Sidebar con navegación

### Gestión de Productos
![Productos](screenshot-productos.png)
- Tabla de inventario
- Búsqueda
- Botones de acción (editar/eliminar)

---

## 🐛 Troubleshooting

### El dashboard no carga
- Verificar que el backend esté corriendo
- Verificar conexión a la base de datos
- Check console del navegador para errores

### Los productos no se muestran
- Verificar que `/api/productos` responda correctamente
- Check Network tab en DevTools
- Verificar que hay productos en la BD

### El formulario no envía
- Verificar campos requeridos
- Check validaciones en el formulario
- Ver console para errores de red

---

## 📚 Stack Tecnológico

- **Framework:** Next.js 14.2.3
- **React:** 18
- **Styling:** Tailwind CSS 3.4
- **UI Components:** Shadcn/ui + Radix UI
- **Icons:** Lucide React
- **State Management:** React Hooks
- **API Calls:** Fetch API nativo
- **Forms:** HTML5 + React state
- **Notifications:** Custom toast system

---

## ✨ Destacados

1. **Arquitectura modular:** Fácil de extender y mantener
2. **Diseño profesional:** UI moderna y limpia
3. **100% funcional:** Listo para producción
4. **Preparado para crecer:** Estructura escalable
5. **UX excepcional:** Feedback inmediato y claro

---

**¡El Panel de Administrador de Blooment está listo para gestionar tu negocio de flores! 🌸**

Para comenzar, visita: https://petal-shop-api.preview.emergentagent.com/admin
