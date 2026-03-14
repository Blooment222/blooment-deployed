'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/lib/auth-client'
import { formatCurrency } from '@/lib/currency'

export default function ProductosPage() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    medidas: '',
    flores_incluidas: '',
    precio: '',
    stock: '',
    imagen_url: '',
    categoria: '',
    tipo_flor: '',
    ocasion: '',
    en_oferta: false,
    precio_oferta: '',
    porcentaje_descuento: '',
    fecha_inicio_oferta: '',
    fecha_fin_oferta: ''
  })
  const { toast } = useToast()
  const { getToken } = useAuth()

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    try {
      const res = await fetch('/api/productos')
      const data = await res.json()
      setProductos(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        medidas: product.medidas || '',
        flores_incluidas: product.flores_incluidas || '',
        precio: product.precio.toString(),
        stock: product.stock.toString(),
        imagen_url: product.imagen_url || '',
        categoria: product.categoria || '',
        tipo_flor: product.tipo_flor || '',
        ocasion: product.ocasion || '',
        en_oferta: product.en_oferta || false,
        precio_oferta: product.precio_oferta ? product.precio_oferta.toString() : '',
        porcentaje_descuento: product.porcentaje_descuento ? product.porcentaje_descuento.toString() : '',
        fecha_inicio_oferta: product.fecha_inicio_oferta || '',
        fecha_fin_oferta: product.fecha_fin_oferta || ''
      })
    } else {
      setEditingProduct(null)
      setFormData({
        nombre: '',
        descripcion: '',
        medidas: '',
        flores_incluidas: '',
        precio: '',
        stock: '',
        imagen_url: '',
        categoria: '',
        tipo_flor: '',
        ocasion: '',
        en_oferta: false,
        precio_oferta: '',
        porcentaje_descuento: '',
        fecha_inicio_oferta: '',
        fecha_fin_oferta: ''
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingProduct(null)
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      imagen_url: '',
      categoria: '',
      tipo_flor: '',
      ocasion: '',
      en_oferta: false,
      precio_oferta: '',
      porcentaje_descuento: '',
      fecha_inicio_oferta: '',
      fecha_fin_oferta: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const token = getToken()
      const url = editingProduct 
        ? `/api/productos/${editingProduct.id}`
        : '/api/productos'
      
      const method = editingProduct ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          precio: parseFloat(formData.precio),
          stock: parseInt(formData.stock)
        })
      })

      if (res.ok) {
        toast({
          title: 'Éxito',
          description: editingProduct 
            ? 'Producto actualizado correctamente'
            : 'Producto creado correctamente'
        })
        handleCloseDialog()
        fetchProductos()
      } else {
        const error = await res.json()
        toast({
          title: 'Error',
          description: error.error || 'Ocurrió un error',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el producto',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return
    }

    try {
      const token = getToken()
      const res = await fetch(`/api/productos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        toast({
          title: 'Éxito',
          description: 'Producto eliminado correctamente'
        })
        fetchProductos()
      } else {
        const error = await res.json()
        toast({
          title: 'Error',
          description: error.error || 'No se pudo eliminar el producto',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el producto',
        variant: 'destructive'
      })
    }
  }

  const filteredProductos = Array.isArray(productos) 
    ? productos.filter(producto =>
        producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : []

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Productos</h1>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-muted-foreground">Gestiona tu inventario de flores</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Producto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventario de Flores</CardTitle>
          <CardDescription>
            {productos.length} productos en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          {filteredProductos.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No se encontraron productos con ese término' : 'Comienza agregando tu primer producto'}
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProductos.map((producto) => (
                    <TableRow key={producto.id}>
                      <TableCell className="font-medium">{producto.nombre}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {producto.descripcion ? (
                          producto.descripcion.length > 50
                            ? producto.descripcion.substring(0, 50) + '...'
                            : producto.descripcion
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(producto.precio)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={producto.stock < 10 ? 'text-orange-500 font-medium' : ''}>
                          {producto.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(producto)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(producto.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Agregar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Modifica los datos del producto'
                : 'Completa los datos del nuevo producto'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Ramo de Rosas Rojas"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe el producto..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="medidas">Medidas</Label>
                <Input
                  id="medidas"
                  value={formData.medidas}
                  onChange={(e) => setFormData({ ...formData, medidas: e.target.value })}
                  placeholder="Ej: 40cm x 30cm"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="flores_incluidas">Composición Floral</Label>
                <Textarea
                  id="flores_incluidas"
                  value={formData.flores_incluidas}
                  onChange={(e) => setFormData({ ...formData, flores_incluidas: e.target.value })}
                  placeholder="Ej: 12 rosas rojas, 5 lirios blancos, follaje de temporada"
                  rows={2}
                />
              </div>

              {/* Categoría y Tipo de Flor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <select
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">Sin categoría</option>
                    <option value="Ramos">Ramos</option>
                    <option value="Arreglos">Arreglos</option>
                    <option value="Plantas">Plantas</option>
                    <option value="Bouquets">Bouquets</option>
                    <option value="Decoración">Decoración</option>
                  </select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="tipo_flor">Tipo de Flor</Label>
                  <select
                    id="tipo_flor"
                    value={formData.tipo_flor}
                    onChange={(e) => setFormData({ ...formData, tipo_flor: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="Rosas">Rosas</option>
                    <option value="Tulipanes">Tulipanes</option>
                    <option value="Girasoles">Girasoles</option>
                    <option value="Lirios">Lirios</option>
                    <option value="Orquídeas">Orquídeas</option>
                    <option value="Claveles">Claveles</option>
                    <option value="Margaritas">Margaritas</option>
                    <option value="Hortensias">Hortensias</option>
                    <option value="Peonías">Peonías</option>
                    <option value="Mixtas">Mixtas</option>
                  </select>
                </div>
              </div>

              {/* Ocasión */}
              <div className="grid gap-2">
                <Label htmlFor="ocasion">Ocasión</Label>
                <select
                  id="ocasion"
                  value={formData.ocasion}
                  onChange={(e) => setFormData({ ...formData, ocasion: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">Todas las ocasiones</option>
                  <option value="Cumpleaños">Cumpleaños</option>
                  <option value="Aniversario">Aniversario</option>
                  <option value="Boda">Boda</option>
                  <option value="San Valentín">San Valentín</option>
                  <option value="Día de la Madre">Día de la Madre</option>
                  <option value="Condolencias">Condolencias</option>
                  <option value="Graduación">Graduación</option>
                  <option value="Agradecimiento">Agradecimiento</option>
                  <option value="Romántica">Romántica</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="precio">Precio (MXN) *</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    placeholder="450.00"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="50"
                    required
                  />
                </div>
              </div>

              {/* Oferta */}
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="en_oferta"
                    checked={formData.en_oferta}
                    onChange={(e) => setFormData({ ...formData, en_oferta: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="en_oferta" className="font-semibold">Este producto está en oferta</Label>
                </div>

                {formData.en_oferta && (
                  <div className="grid gap-4 bg-orange-50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="precio_oferta">Precio Oferta ($)</Label>
                        <Input
                          id="precio_oferta"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.precio_oferta}
                          onChange={(e) => {
                            const precioOferta = parseFloat(e.target.value)
                            const precioOriginal = parseFloat(formData.precio)
                            const porcentaje = precioOriginal > 0 ? Math.round(((precioOriginal - precioOferta) / precioOriginal) * 100) : 0
                            setFormData({ 
                              ...formData, 
                              precio_oferta: e.target.value,
                              porcentaje_descuento: porcentaje.toString()
                            })
                          }}
                          placeholder="35.00"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="porcentaje_descuento">% Descuento</Label>
                        <Input
                          id="porcentaje_descuento"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.porcentaje_descuento}
                          onChange={(e) => {
                            const porcentaje = parseFloat(e.target.value)
                            const precioOriginal = parseFloat(formData.precio)
                            const precioOferta = precioOriginal * (1 - porcentaje / 100)
                            setFormData({ 
                              ...formData, 
                              porcentaje_descuento: e.target.value,
                              precio_oferta: precioOferta.toFixed(2)
                            })
                          }}
                          placeholder="20"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fecha_inicio_oferta">Fecha Inicio</Label>
                        <Input
                          id="fecha_inicio_oferta"
                          type="date"
                          value={formData.fecha_inicio_oferta}
                          onChange={(e) => setFormData({ ...formData, fecha_inicio_oferta: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="fecha_fin_oferta">Fecha Fin</Label>
                        <Input
                          id="fecha_fin_oferta"
                          type="date"
                          value={formData.fecha_fin_oferta}
                          onChange={(e) => setFormData({ ...formData, fecha_fin_oferta: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="imagen_url">URL de Imagen</Label>
                <Input
                  id="imagen_url"
                  type="url"
                  value={formData.imagen_url}
                  onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#D60464] hover:bg-[#C4055D]">
                {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
