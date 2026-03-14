'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Ticket, Plus, Trash2, Edit, CheckCircle2, XCircle, Calendar, DollarSign, Percent } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

export default function CuponesAdmin() {
  const [cupones, setCupones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Formulario
  const [formData, setFormData] = useState({
    codigo: '',
    tipo: 'porcentaje',
    valor: '',
    monto_minimo: '',
    fecha_fin: ''
  })

  useEffect(() => {
    fetchCupones()
  }, [])

  const fetchCupones = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/cupones', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        setCupones(data)
      }
    } catch (error) {
      console.error('Error cargando cupones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/cupones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          codigo: formData.codigo.toUpperCase(),
          tipo: formData.tipo,
          valor: parseFloat(formData.valor),
          monto_minimo: formData.monto_minimo ? parseFloat(formData.monto_minimo) : 0,
          fecha_fin: formData.fecha_fin ? new Date(formData.fecha_fin).toISOString() : null
        })
      })
      
      if (res.ok) {
        await fetchCupones()
        setShowForm(false)
        setFormData({
          codigo: '',
          tipo: 'porcentaje',
          valor: '',
          monto_minimo: '',
          fecha_fin: ''
        })
        alert('Cupón creado exitosamente')
      } else {
        const error = await res.json()
        alert('Error al crear cupón: ' + (error.error || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear cupón')
    }
  }

  const handleToggleActivo = async (id, activo) => {
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`/api/admin/cupones/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activo: !activo })
      })
      
      if (res.ok) {
        await fetchCupones()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return
    
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`/api/admin/cupones/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        await fetchCupones()
        alert('Cupón eliminado')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ticket className="w-8 h-8 text-[#F5B6C6]" />
            Gestión de Cupones
          </h1>
          <p className="text-muted-foreground mt-1">Crea y administra cupones de descuento para tus clientes</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cupón
        </Button>
      </div>

      {/* Formulario de Creación */}
      {showForm && (
        <Card className="border-[#F5B6C6] border-2">
          <CardHeader>
            <CardTitle>Crear Nuevo Cupón</CardTitle>
            <CardDescription>Completa los datos para crear un cupón de descuento</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Código del Cupón */}
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código del Cupón *</Label>
                  <Input
                    id="codigo"
                    placeholder="Ej: MAMA10, BLOOMENT2026"
                    value={formData.codigo}
                    onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                    required
                    className="uppercase"
                  />
                  <p className="text-xs text-gray-500">Se convertirá a mayúsculas automáticamente</p>
                </div>

                {/* Tipo de Descuento */}
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Descuento *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentaje">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4" />
                          Porcentaje %
                        </div>
                      </SelectItem>
                      <SelectItem value="monto_fijo">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          $ MXN Monto Fijo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor del Descuento */}
                <div className="space-y-2">
                  <Label htmlFor="valor">
                    Valor del Descuento * {formData.tipo === 'porcentaje' ? '(%)' : '($ MXN)'}
                  </Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    placeholder={formData.tipo === 'porcentaje' ? '10' : '50'}
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    required
                  />
                  {formData.tipo === 'porcentaje' && (
                    <p className="text-xs text-gray-500">Ej: 10 = 10% de descuento</p>
                  )}
                </div>

                {/* Monto Mínimo */}
                <div className="space-y-2">
                  <Label htmlFor="monto_minimo">Monto Mínimo de Compra ($ MXN)</Label>
                  <Input
                    id="monto_minimo"
                    type="number"
                    step="0.01"
                    placeholder="0 = Sin mínimo"
                    value={formData.monto_minimo}
                    onChange={(e) => setFormData({...formData, monto_minimo: e.target.value})}
                  />
                  <p className="text-xs text-gray-500">Opcional: Compra mínima requerida en pesos mexicanos</p>
                </div>

                {/* Fecha de Expiración */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="fecha_fin">Fecha de Expiración</Label>
                  <div className="relative w-full">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                    <Input
                      id="fecha_fin"
                      type="date"
                      className="w-full pl-10"
                      value={formData.fecha_fin}
                      onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Opcional: Deja vacío para cupón sin expiración</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#F5B6C6] hover:bg-[#F5B6C6]/90 text-white"
                >
                  Crear Cupón
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Cupones */}
      <Card>
        <CardHeader>
          <CardTitle>Cupones Existentes</CardTitle>
          <CardDescription>Administra tus cupones de descuento</CardDescription>
        </CardHeader>
        <CardContent>
          {cupones.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay cupones creados</p>
              <p className="text-sm text-gray-400 mt-2">Crea tu primer cupón usando el botón "Nuevo Cupón"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cupones.map((cupon) => (
                <div key={cupon.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-[#F5B6C6]">{cupon.codigo}</h3>
                        {cupon.activo ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactivo
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Tipo</p>
                          <p className="font-semibold">
                            {cupon.tipo === 'porcentaje' ? (
                              <span className="flex items-center gap-1">
                                <Percent className="w-4 h-4" />
                                {cupon.valor}% OFF
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {formatCurrency(cupon.valor, false)} OFF
                              </span>
                            )}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Usos</p>
                          <p className="font-semibold">
                            {cupon.usos} {cupon.usos_maximos ? `/ ${cupon.usos_maximos}` : '/ ∞'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Expira</p>
                          <p className="font-semibold">
                            {cupon.fecha_fin ? new Date(cupon.fecha_fin).toLocaleDateString() : 'Nunca'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Creado</p>
                          <p className="font-semibold">
                            {new Date(cupon.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant={cupon.activo ? "outline" : "default"}
                        onClick={() => handleToggleActivo(cupon.id, cupon.activo)}
                        className={cupon.activo ? '' : 'bg-[#F5B6C6] hover:bg-[#F5B6C6]/90'}
                      >
                        {cupon.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(cupon.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
