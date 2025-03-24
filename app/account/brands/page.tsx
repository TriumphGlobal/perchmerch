"use client"

import { useState, useEffect } from "react"
import { usePerchAuth } from "../../../hooks/usePerchAuth"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Store, Edit, ExternalLink, Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "../../../components/ui/use-toast"
import { processImageForBrand } from "../../../lib/utils"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs"
import { Brand } from "@prisma/client"

interface BrandWithCount extends Brand {
  _count?: {
    products: number;
  };
}

export default function BrandsPage() {
  const { isSignedIn, localUser, clerkUser } = usePerchAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [brands, setBrands] = useState<BrandWithCount[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (localUser) {
      // Load brands from local database
      const loadBrands = async () => {
        try {
          const response = await fetch(`/api/brands?userEmail=${localUser.email}`)
          if (!response.ok) {
            throw new Error('Failed to load brands')
          }
          const data = await response.json()
          setBrands(data.brands || [])
        } catch (error) {
          console.error('Error loading brands:', error)
          toast({
            title: "Error",
            description: "Failed to load brands",
            variant: "destructive"
          })
        } finally {
          setLoading(false)
        }
      }

      loadBrands()
    }
  }, [localUser])

  const handleDeleteBrand = async (brandId: string) => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/brands/${brandId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete brand')
      }

      // Update the brands list after deletion
      setBrands(brands.filter(brand => brand.id !== brandId))
      
      toast({
        title: "Brand deleted",
        description: "Your brand has been successfully deleted."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete brand",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <SignedIn>
        <div className="container mx-auto py-6">
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">My Brands</h1>
                <p className="text-muted-foreground">
                  Manage your merchandise brands and stores
                </p>
              </div>
              <Link href="/brands/create">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Brand
                </Button>
              </Link>
            </div>

            {brands.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No brands yet</h2>
                <p className="text-muted-foreground mb-6">
                  Create your first brand to start selling merchandise
                </p>
                <Link href="/brands/create">
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Brand
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {brands.map((brand) => (
                  <Card key={brand.id} className="overflow-hidden">
                    <div className="h-36 bg-muted relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        {brand.imageUrl ? (
                          <Image 
                            src={brand.imageUrl} 
                            alt={brand.name} 
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Store className="h-16 w-16 text-muted-foreground/40" />
                        )}
                      </div>
                      {brand.id === "demo" && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          Demo
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-primary" />
                        {brand.name}
                      </CardTitle>
                      <CardDescription>/{brand.brandId}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{brand.description || "No description provided"}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                        <div>
                          <p className="text-muted-foreground">Products</p>
                          <p className="font-medium">{brand._count?.products || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Sales</p>
                          <p className="font-medium">${brand.totalSales || 0}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Link href={`/${brand.brandId}`} className="flex-1">
                            <Button variant="outline" className="w-full flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              View Store
                            </Button>
                          </Link>
                          <Link href={`/brands/manage/${brand.brandId}`} className="flex-1">
                            <Button className="w-full flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              Manage
                            </Button>
                          </Link>
                        </div>
                        {brand.brandId !== "demo" && (
                          <Button 
                            variant="destructive" 
                            className="flex items-center gap-2"
                            onClick={() => handleDeleteBrand(brand.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete Brand
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
} 