"use client"

import { useState, useEffect } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  ArrowDown, 
  ArrowUp, 
  Star, 
  XCircle,
  PlusCircle
} from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface FeaturedBrand {
  id: string
  brandId: string
  brandName: string
  position: number
  createdAt: string
}

interface Brand {
  id: string
  name: string
  brandId: string
  isApproved: boolean
}

export function FeaturedBrandManager() {
  const [featuredBrands, setFeaturedBrands] = useState<FeaturedBrand[]>([])
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([])
  const [selectedbrandId, setSelectedbrandId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch featured brands
        const featuredResponse = await fetch('/api/admin/featured-brands')
        if (!featuredResponse.ok) {
          throw new Error('Failed to fetch featured brands')
        }
        const featuredData = await featuredResponse.json()
        setFeaturedBrands(featuredData.featuredBrands || [])
        
        // Fetch available brands that can be featured
        const brandsResponse = await fetch('/api/admin/brands?approved=true&notFeatured=true')
        if (!brandsResponse.ok) {
          throw new Error('Failed to fetch available brands')
        }
        const brandsData = await brandsResponse.json()
        setAvailableBrands(brandsData.brands || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const handleAddFeatured = async () => {
    if (!selectedbrandId) return
    
    try {
      const response = await fetch('/api/admin/featured-brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ brandId: selectedbrandId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to add featured brand')
      }
      
      const data = await response.json()
      
      // Add the new featured brand to the list
      setFeaturedBrands(prev => [...prev, data.featuredBrand])
      
      // Remove the brand from available brands
      setAvailableBrands(prev => prev.filter(brand => brand.id !== selectedbrandId))
      
      // Reset the selection
      setSelectedbrandId("")
    } catch (error) {
      console.error('Error adding featured brand:', error)
    }
  }

  const handleRemoveFeatured = async (featuredbrandId: string, brandId: string) => {
    try {
      const response = await fetch(`/api/admin/featured-brands/${featuredbrandId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove featured brand')
      }
      
      // Remove from featured brands
      setFeaturedBrands(prev => prev.filter(item => item.id !== featuredbrandId))
      
      // Get the brand details to add back to available brands
      const brandResponse = await fetch(`/api/admin/brands/${brandId}`)
      if (brandResponse.ok) {
        const brandData = await brandResponse.json()
        setAvailableBrands(prev => [...prev, brandData.brand])
      }
    } catch (error) {
      console.error('Error removing featured brand:', error)
    }
  }

  const handleMoveUp = async (featuredbrandId: string, currentPosition: number) => {
    if (currentPosition <= 0) return // Already at the top
    
    try {
      const response = await fetch(`/api/admin/featured-brands/${featuredbrandId}/position`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ position: currentPosition - 1 })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update position')
      }
      
      // Update positions locally
      const updatedBrands = [...featuredBrands].sort((a, b) => a.position - b.position)
      const itemToMove = updatedBrands.find(item => item.id === featuredbrandId)
      const itemToSwap = updatedBrands.find(item => item.position === currentPosition - 1)
      
      if (itemToMove && itemToSwap) {
        itemToMove.position = currentPosition - 1
        itemToSwap.position = currentPosition
        setFeaturedBrands(updatedBrands)
      }
    } catch (error) {
      console.error('Error updating position:', error)
    }
  }

  const handleMoveDown = async (featuredbrandId: string, currentPosition: number) => {
    if (currentPosition >= featuredBrands.length - 1) return // Already at the bottom
    
    try {
      const response = await fetch(`/api/admin/featured-brands/${featuredbrandId}/position`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ position: currentPosition + 1 })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update position')
      }
      
      // Update positions locally
      const updatedBrands = [...featuredBrands].sort((a, b) => a.position - b.position)
      const itemToMove = updatedBrands.find(item => item.id === featuredbrandId)
      const itemToSwap = updatedBrands.find(item => item.position === currentPosition + 1)
      
      if (itemToMove && itemToSwap) {
        itemToMove.position = currentPosition + 1
        itemToSwap.position = currentPosition
        setFeaturedBrands(updatedBrands)
      }
    } catch (error) {
      console.error('Error updating position:', error)
    }
  }

  // Sort featured brands by position
  const sortedFeaturedBrands = [...featuredBrands].sort((a, b) => a.position - b.position)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Featured Brands</h2>
        
        <div className="flex items-center gap-2">
          <Select value={selectedbrandId} onValueChange={setSelectedbrandId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a brand" />
            </SelectTrigger>
            <SelectContent>
              {availableBrands.length === 0 ? (
                <SelectItem value="none" disabled>No brands available</SelectItem>
              ) : (
                availableBrands.map(brand => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleAddFeatured} 
            disabled={!selectedbrandId}
            size="sm"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Featured
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Loading featured brands...</div>
      ) : sortedFeaturedBrands.length === 0 ? (
        <Alert>
          <AlertTitle>No featured brands</AlertTitle>
          <AlertDescription>
            You haven't featured any brands yet. Use the dropdown above to select and feature a brand.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Brand Name</TableHead>
                <TableHead>Featured Since</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFeaturedBrands.map((featuredBrand, index) => (
                <TableRow key={featuredBrand.id}>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-primary/10 text-primary font-medium">
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    {featuredBrand.brandName}
                  </TableCell>
                  <TableCell>{new Date(featuredBrand.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveUp(featuredBrand.id, featuredBrand.position)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveDown(featuredBrand.id, featuredBrand.position)}
                        disabled={index === sortedFeaturedBrands.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveFeatured(featuredBrand.id, featuredBrand.brandId)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
} 