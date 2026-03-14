'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Search, Users, Mail, Phone, MapPin } from 'lucide-react'
import { useAuth } from '@/lib/auth-client'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { getToken } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/clientes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!res.ok) throw new Error('Error al cargar clientes')
      const data = await res.json()
      setClientes(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los clientes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono?.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando clientes...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Clientes Registrados
          </CardTitle>
          <CardDescription>
            {clientes.length} clientes en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          {filteredClientes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay clientes</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'No se encontraron clientes con ese término' : 'Aún no hay clientes registrados'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cliente.nombre}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {cliente.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {cliente.telefono ? (
                          <p className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {cliente.telefono}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cliente.direccion ? (
                          <p className="text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {cliente.direccion.length > 30
                              ? cliente.direccion.substring(0, 30) + '...'
                              : cliente.direccion}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(cliente.createdAt), "d MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          cliente.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
