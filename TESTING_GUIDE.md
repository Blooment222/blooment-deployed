# 🧪 Guía de Pruebas - API de Venta de Flores

Esta guía te ayudará a probar todos los endpoints de la API paso por paso.

## 📍 URL Base
```
https://petal-shop-api.preview.emergentagent.com/api
```

Para pruebas locales:
```
http://localhost:3000/api
```

---

## 🔍 1. Verificar que la API está funcionando

```bash
curl https://petal-shop-api.preview.emergentagent.com/api/
```

**Respuesta esperada:**
```json
{
  "message": "API de Venta de Flores",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

---

## 👥 2. Pruebas de Usuarios

### Crear un usuario
```bash
curl -X POST https://petal-shop-api.preview.emergentagent.com/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Carlos Rodríguez",
    "email": "carlos@example.com",
    "telefono": "+34 612 345 678",
    "direccion": "Calle de las Flores 15, Madrid"
  }'
```

**Guarda el `id` del usuario que te devuelve para usarlo después.**

### Listar todos los usuarios
```bash
curl https://petal-shop-api.preview.emergentagent.com/api/usuarios
```

### Obtener un usuario específico (reemplaza {id} con el ID real)
```bash
curl https://petal-shop-api.preview.emergentagent.com/api/usuarios/{id}
```

### Actualizar un usuario
```bash
curl -X PUT https://petal-shop-api.preview.emergentagent.com/api/usuarios/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Carlos Rodríguez López",
    "telefono": "+34 612 999 888"
  }'
```

---

## 🌸 3. Pruebas de Productos

### Crear productos
```bash
# Producto 1: Ramo de Rosas
curl -X POST https://petal-shop-api.preview.emergentagent.com/api/productos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Ramo de 12 Rosas Rojas",
    "descripcion": "Hermoso ramo de rosas rojas frescas importadas de Ecuador",
    "precio": 45.00,
    "stock": 25,
    "imagen_url": "https://example.com/rosas-rojas.jpg"
  }'

# Producto 2: Tulipanes
curl -X POST https://petal-shop-api.preview.emergentagent.com/api/productos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Tulipanes Holandeses Mix",
    "descripcion": "Ramo de 10 tulipanes de colores variados",
    "precio": 32.50,
    "stock": 30,
    "imagen_url": "https://example.com/tulipanes.jpg"
  }'

# Producto 3: Orquídeas
curl -X POST https://petal-shop-api.preview.emergentagent.com/api/productos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Orquídea Phalaenopsis",
    "descripcion": "Elegante orquídea en maceta decorativa",
    "precio": 55.00,
    "stock": 15,
    "imagen_url": "https://example.com/orquidea.jpg"
  }'
```

**Guarda los IDs de los productos.**

### Listar todos los productos
```bash
curl https://petal-shop-api.preview.emergentagent.com/api/productos
```

### Actualizar stock de un producto
```bash
curl -X PUT https://petal-shop-api.preview.emergentagent.com/api/productos/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 20
  }'
```

---

## 🛒 4. Pruebas de Pedidos

### Crear un pedido con múltiples productos
```bash
curl -X POST https://petal-shop-api.preview.emergentagent.com/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": "{ID_DEL_USUARIO}",
    "total": 132.50,
    "estado": "pendiente",
    "detalles": [
      {
        "productoId": "{ID_ROSAS}",
        "cantidad": 2,
        "precio_unitario": 45.00
      },
      {
        "productoId": "{ID_TULIPANES}",
        "cantidad": 1,
        "precio_unitario": 32.50
      }
    ]
  }'
```

**Importante:** Reemplaza `{ID_DEL_USUARIO}`, `{ID_ROSAS}` y `{ID_TULIPANES}` con los IDs reales.

**Guarda el ID del pedido.**

### Listar todos los pedidos (verás el usuario, productos y detalles)
```bash
curl https://petal-shop-api.preview.emergentagent.com/api/pedidos
```

### Obtener un pedido específico con todos sus detalles
```bash
curl https://petal-shop-api.preview.emergentagent.com/api/pedidos/{id}
```

### Actualizar el estado de un pedido
```bash
# Marcar como pagado
curl -X PUT https://petal-shop-api.preview.emergentagent.com/api/pedidos/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "pagado"
  }'

# Marcar como enviado
curl -X PUT https://petal-shop-api.preview.emergentagent.com/api/pedidos/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "enviado"
  }'
```

---

## 💳 5. Pruebas de Pagos

### Registrar un pago con tarjeta
```bash
curl -X POST https://petal-shop-api.preview.emergentagent.com/api/pagos \
  -H "Content-Type: application/json" \
  -d '{
    "pedidoId": "{ID_DEL_PEDIDO}",
    "usuarioId": "{ID_DEL_USUARIO}",
    "monto": 132.50,
    "metodo": "tarjeta",
    "estado": "completado",
    "referencia_externa": "VISA-4532-1234-5678-9012"
  }'
```

### Registrar un pago con transferencia
```bash
curl -X POST https://petal-shop-api.preview.emergentagent.com/api/pagos \
  -H "Content-Type: application/json" \
  -d '{
    "pedidoId": "{ID_DEL_PEDIDO}",
    "usuarioId": "{ID_DEL_USUARIO}",
    "monto": 132.50,
    "metodo": "transferencia",
    "estado": "pendiente",
    "referencia_externa": "TRANS-2025-001234"
  }'
```

### Listar todos los pagos
```bash
curl https://petal-shop-api.preview.emergentagent.com/api/pagos
```

### Actualizar estado de un pago
```bash
curl -X PUT https://petal-shop-api.preview.emergentagent.com/api/pagos/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "completado"
  }'
```

---

## 📝 6. Pruebas de Detalles de Pedido

### Listar todos los detalles
```bash
curl https://petal-shop-api.preview.emergentagent.com/api/detalles-pedido
```

### Agregar un producto adicional a un pedido existente
```bash
curl -X POST https://petal-shop-api.preview.emergentagent.com/api/detalles-pedido \
  -H "Content-Type: application/json" \
  -d '{
    "pedidoId": "{ID_DEL_PEDIDO}",
    "productoId": "{ID_ORQUIDEA}",
    "cantidad": 1,
    "precio_unitario": 55.00
  }'
```

---

## 🧹 7. Pruebas de Eliminación (CASCADE)

### Eliminar un pago
```bash
curl -X DELETE https://petal-shop-api.preview.emergentagent.com/api/pagos/{id}
```

### Eliminar un pedido (elimina también sus detalles y pagos)
```bash
curl -X DELETE https://petal-shop-api.preview.emergentagent.com/api/pedidos/{id}
```

### Eliminar un producto (solo si no tiene detalles asociados)
```bash
curl -X DELETE https://petal-shop-api.preview.emergentagent.com/api/productos/{id}
```

### Eliminar un usuario (elimina también sus pedidos y pagos)
```bash
curl -X DELETE https://petal-shop-api.preview.emergentagent.com/api/usuarios/{id}
```

---

## 🚨 8. Pruebas de Validación

### Intentar crear usuario sin email (debe fallar)
```bash
curl -X POST https://petal-shop-api.preview.emergentagent.com/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test Usuario"
  }'
```

**Respuesta esperada:** Error 400 - "nombre y email son requeridos"

### Intentar crear producto sin precio (debe fallar)
```bash
curl -X POST https://petal-shop-api.preview.emergentagent.com/api/productos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Producto sin precio"
  }'
```

**Respuesta esperada:** Error 400 - "nombre y precio son requeridos"

### Intentar crear pedido sin detalles (debe fallar)
```bash
curl -X POST https://petal-shop-api.preview.emergentagent.com/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": "{ID_USUARIO}",
    "total": 100.00
  }'
```

**Respuesta esperada:** Error 400 - "usuarioId y detalles son requeridos"

---

## 📊 9. Flujo Completo de Compra

Aquí un script completo que simula una compra real:

```bash
# 1. Crear cliente
USUARIO=$(curl -s -X POST https://petal-shop-api.preview.emergentagent.com/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Ana Martínez",
    "email": "ana.martinez@example.com",
    "telefono": "+34 666 777 888",
    "direccion": "Plaza Mayor 5, Barcelona"
  }' | jq -r '.id')

echo "Usuario creado: $USUARIO"

# 2. Crear productos
ROSA=$(curl -s -X POST https://petal-shop-api.preview.emergentagent.com/api/productos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Ramo de Rosas",
    "precio": 45.00,
    "stock": 50
  }' | jq -r '.id')

echo "Producto creado: $ROSA"

# 3. Crear pedido
PEDIDO=$(curl -s -X POST https://petal-shop-api.preview.emergentagent.com/api/pedidos \
  -H "Content-Type: application/json" \
  -d "{
    \"usuarioId\": \"$USUARIO\",
    \"total\": 90.00,
    \"detalles\": [
      {
        \"productoId\": \"$ROSA\",
        \"cantidad\": 2,
        \"precio_unitario\": 45.00
      }
    ]
  }" | jq -r '.id')

echo "Pedido creado: $PEDIDO"

# 4. Registrar pago
PAGO=$(curl -s -X POST https://petal-shop-api.preview.emergentagent.com/api/pagos \
  -H "Content-Type: application/json" \
  -d "{
    \"pedidoId\": \"$PEDIDO\",
    \"usuarioId\": \"$USUARIO\",
    \"monto\": 90.00,
    \"metodo\": \"tarjeta\",
    \"estado\": \"completado\"
  }" | jq -r '.id')

echo "Pago registrado: $PAGO"

# 5. Actualizar estado del pedido
curl -X PUT https://petal-shop-api.preview.emergentagent.com/api/pedidos/$PEDIDO \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "pagado"
  }'

echo "Pedido actualizado a 'pagado'"

# 6. Ver el pedido completo
curl -s https://petal-shop-api.preview.emergentagent.com/api/pedidos/$PEDIDO | jq '.'
```

---

## 🔍 10. Consultas Útiles

### Ver todos los pedidos de un usuario
1. Obtener el usuario con sus pedidos:
```bash
curl https://petal-shop-api.preview.emergentagent.com/api/usuarios/{id}
```

### Ver el historial de pagos
```bash
curl https://petal-shop-api.preview.emergentagent.com/api/pagos
```

### Ver los productos más vendidos
1. Obtener todos los detalles de pedidos:
```bash
curl https://petal-shop-api.preview.emergentagent.com/api/detalles-pedido
```

---

## 💡 Consejos

1. **Usa [jq](https://stedolan.github.io/jq/)** para formatear las respuestas JSON:
   ```bash
   curl https://petal-shop-api.preview.emergentagent.com/api/usuarios | jq '.'
   ```

2. **Guarda los IDs** en variables de entorno:
   ```bash
   export USER_ID="uuid-del-usuario"
   export PRODUCT_ID="uuid-del-producto"
   ```

3. **Usa Postman o Insomnia** para pruebas más visuales

4. **Verifica la base de datos** en Supabase Dashboard para ver los cambios en tiempo real

---

## 📌 Estados Válidos

### Pedidos:
- `pendiente` - Pedido creado, esperando pago
- `pagado` - Pago recibido
- `enviado` - Pedido en camino
- `cancelado` - Pedido cancelado

### Pagos:
- `pendiente` - Pago en proceso
- `completado` - Pago confirmado
- `fallido` - Pago rechazado

### Métodos de Pago:
- `tarjeta`
- `efectivo`
- `transferencia`
- `paypal`
- Cualquier otro método personalizado

---

¡Disfruta probando la API! 🌸
