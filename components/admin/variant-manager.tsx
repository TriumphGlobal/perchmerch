"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Plus, Trash2, Save, Eye, EyeOff, AlertTriangle, ArrowUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Variant {
  id?: string
  title: string
  price: number
  sku?: string
  inventory: number
  isHidden: boolean
  totalSales: number
  totalRevenue: number
  lowStockThreshold?: number
  lastRestocked?: Date
  reorderPoint?: number
}

interface VariantManagerProps {
  productId: string
  initialVariants?: Variant[]
  onUpdate?: () => void
}

export function VariantManager({ 
  productId, 
  initialVariants = [], 
  onUpdate 
}: VariantManagerProps) {
  const [variants, setVariants] = useState<Variant[]>(initialVariants)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set())
  const [sortField, setSortField] = useState<keyof Variant>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    if (!initialVariants.length) {
      fetchVariants()
    }
  }, [productId])

  const fetchVariants = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch variants')
      }

      setVariants(data.variants)
    } catch (error) {
      console.error('Error fetching variants:', error)
      toast({
        title: "Error",
        description: "Failed to fetch variants",
        variant: "destructive"
      })
    }
  }

  const handleSort = (field: keyof Variant) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }

    const sortedVariants = [...variants].sort((a, b) => {
      const aValue = a[field]
      const bValue = b[field]

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return 0
    })

    setVariants(sortedVariants)
  }

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        title: "",
        price: 0,
        inventory: 0,
        isHidden: false,
        totalSales: 0,
        totalRevenue: 0,
        lowStockThreshold: 10,
        reorderPoint: 5
      }
    ])
  }

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
    setSelectedVariants(new Set([...selectedVariants].filter(i => i !== index)))
  }

  const handleUpdateVariant = (index: number, updates: Partial<Variant>) => {
    setVariants(variants.map((variant, i) => 
      i === index ? { ...variant, ...updates } : variant
    ))
  }

  const handleToggleVisibility = async (variantId: string, isHidden: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants/${variantId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden })
      })

      if (!response.ok) {
        throw new Error('Failed to update variant visibility')
      }

      toast({
        title: "Success",
        description: `Variant ${isHidden ? 'hidden' : 'visible'}`
      })

      fetchVariants()
    } catch (error) {
      console.error('Error updating variant visibility:', error)
      toast({
        title: "Error",
        description: "Failed to update variant visibility",
        variant: "destructive"
      })
    }
  }

  const handleBatchOperation = async (operation: 'delete' | 'hide' | 'show') => {
    const selectedIndexes = Array.from(selectedVariants)
    const selectedIds = selectedIndexes
      .map(index => variants[index].id)
      .filter(Boolean) as string[]

    if (!selectedIds.length) return

    try {
      const response = await fetch(`/api/admin/products/${productId}/variants/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          variantIds: selectedIds
        })
      })

      if (!response.ok) {
        throw new Error('Failed to perform batch operation')
      }

      toast({
        title: "Success",
        description: `Batch operation completed successfully`
      })

      setSelectedVariants(new Set())
      fetchVariants()
    } catch (error) {
      console.error('Error performing batch operation:', error)
      toast({
        title: "Error",
        description: "Failed to perform batch operation",
        variant: "destructive"
      })
    }
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/products/${productId}/variants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save variants')
      }

      toast({
        title: "Success",
        description: "Variants saved successfully"
      })

      if (onUpdate) {
        onUpdate()
      }

      fetchVariants()
    } catch (error) {
      console.error('Error saving variants:', error)
      toast({
        title: "Error",
        description: "Failed to save variants",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestockVariant = async (variantId: string, quantity: number) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants/${variantId}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      })

      if (!response.ok) {
        throw new Error('Failed to restock variant')
      }

      toast({
        title: "Success",
        description: `Restocked variant with ${quantity} units`
      })

      fetchVariants()
    } catch (error) {
      console.error('Error restocking variant:', error)
      toast({
        title: "Error",
        description: "Failed to restock variant",
        variant: "destructive"
      })
    }
  }

  const getStockStatus = (variant: Variant) => {
    if (variant.inventory <= 0) {
      return { label: 'Out of Stock', color: 'destructive' as const }
    }
    if (variant.inventory <= (variant.reorderPoint || 5)) {
      return { label: 'Reorder', color: 'destructive' as const }
    }
    if (variant.inventory <= (variant.lowStockThreshold || 10)) {
      return { label: 'Low Stock', color: 'warning' as const }
    }
    return { label: 'In Stock', color: 'success' as const }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Variants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {selectedVariants.size > 0 && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <span>{selectedVariants.size} variants selected</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchOperation('delete')}
              >
                Delete Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchOperation('hide')}
              >
                Hide Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchOperation('show')}
              >
                Show Selected
              </Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedVariants.size === variants.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedVariants(new Set(variants.map((_, i) => i)))
                      } else {
                        setSelectedVariants(new Set())
                      }
                    }}
                  />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('title')}
                  >
                    Title
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('price')}
                  >
                    Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('inventory')}
                  >
                    Inventory
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('totalSales')}
                  >
                    Sales
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('totalRevenue')}
                  >
                    Revenue
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant, index) => {
                const stockStatus = getStockStatus(variant)
                return (
                  <TableRow key={variant.id || index}>
                    <TableCell>
                      <Checkbox
                        checked={selectedVariants.has(index)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedVariants)
                          if (checked) {
                            newSelected.add(index)
                          } else {
                            newSelected.delete(index)
                          }
                          setSelectedVariants(newSelected)
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.title}
                        onChange={(e) => handleUpdateVariant(index, { title: e.target.value })}
                        placeholder="Variant title"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={variant.price}
                        onChange={(e) => handleUpdateVariant(index, { price: parseFloat(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.sku || ''}
                        onChange={(e) => handleUpdateVariant(index, { sku: e.target.value })}
                        placeholder="SKU"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={variant.inventory}
                          onChange={(e) => handleUpdateVariant(index, { inventory: parseInt(e.target.value) })}
                          className={variant.inventory <= (variant.reorderPoint || 5) ? 'border-red-500' : ''}
                        />
                        {variant.inventory <= (variant.reorderPoint || 5) && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {variant.totalSales}
                    </TableCell>
                    <TableCell>
                      ${variant.totalRevenue.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stockStatus.color}>
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {variant.id ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleToggleVisibility(variant.id!, !variant.isHidden)}>
                                {variant.isHidden ? (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Show
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Hide
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const quantity = window.prompt('Enter restock quantity:')
                                if (quantity && !isNaN(parseInt(quantity))) {
                                  handleRestockVariant(variant.id!, parseInt(quantity))
                                }
                              }}>
                                Restock
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRemoveVariant(index)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveVariant(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleAddVariant}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>

            <Button
              onClick={handleSave}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 