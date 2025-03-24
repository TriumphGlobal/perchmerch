"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { ImageUpload } from "@/components/dashboard/image-upload"
import { toast } from "@/components/ui/use-toast"

interface ProductForm {
  printifyUrl: string
  title: string
  description: string
  price: number
  image: string
  tagline: string
}

const initialProductForm: ProductForm = {
  printifyUrl: "",
  title: "",
  description: "",
  price: 0,
  image: "",
  tagline: ""
}

export default function AddProductsPage({ params }: { params: { brandId: string } }) {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const { brandId } = params

  const [products, setProducts] = useState<ProductForm[]>([])
  const [currentProduct, setCurrentProduct] = useState<ProductForm>(initialProductForm)
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user has access to this brand
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch(`/api/brands/${brandId}`)
        if (!response.ok) {
          router.push("/brands")
        }
      } catch (error) {
        router.push("/brands")
      }
    }

    if (user) {
      checkAccess()
    }
  }, [user, brandId, router])

  const handlePrintifyUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate Printify URL
      if (!currentProduct.printifyUrl.includes("printify.com")) {
        throw new Error("Please enter a valid Printify product URL")
      }

      // Fetch product details from Printify
      const response = await fetch("/api/printify/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: currentProduct.printifyUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch product details")
      }

      const data = await response.json()
      setCurrentProduct({
        ...currentProduct,
        title: data.title,
        description: data.description,
        price: data.price,
        image: data.image,
      })
      setStep(2)
    } catch (err: any) {
      setError(err.message || "Failed to fetch product details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!currentProduct.title || !currentProduct.description || !currentProduct.image) {
        throw new Error("Please fill in all required fields")
      }

      // Add product to list
      setProducts([...products, currentProduct])

      // Clear current product form
      setCurrentProduct(initialProductForm)

      // Show success message
      toast({
        title: "Product added successfully",
        description: `${products.length + 1} of 8 products added`,
      })

      // Reset to step 1 for next product
      setStep(1)
    } catch (err: any) {
      setError(err.message || "Failed to add product")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinish = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Save all products
      const response = await fetch(`/api/brands/${brandId}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ products }),
      })

      if (!response.ok) {
        throw new Error("Failed to save products")
      }

      // Redirect to brand page
      router.push(`/brands/${brandId}`)
    } catch (err: any) {
      setError(err.message || "Failed to save products")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded || !user) {
    return <div className="container py-8">Loading...</div>
  }

  return (
    <div className="container py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/brands/${brandId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Brand
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add Products</h1>
          <p className="text-muted-foreground">
            {products.length} of 8 products added
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {products.length >= 8 ? (
        <Card>
          <CardHeader>
            <CardTitle>Maximum Products Reached</CardTitle>
            <CardDescription>
              You have added the maximum number of products (8) to your brand.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleFinish}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Saving..." : "Finish and View Brand"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? "Add Printify Product" : "Customize Product"}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? "Enter the Printify product URL to import the product details"
                : "Customize how the product appears in your store"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handlePrintifyUrlSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="printifyUrl">Printify Product URL</Label>
                  <Input
                    id="printifyUrl"
                    placeholder="https://printify.com/..."
                    value={currentProduct.printifyUrl}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        printifyUrl: e.target.value,
                      })
                    }
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Loading..." : "Next"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleProductDetailsSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Product Title</Label>
                  <Input
                    id="title"
                    value={currentProduct.title}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        title: e.target.value,
                      })
                    }
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Product Description</Label>
                  <Textarea
                    id="description"
                    value={currentProduct.description}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        description: e.target.value,
                      })
                    }
                    disabled={isLoading}
                    required
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Product Tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="A catchy phrase to promote this product"
                    value={currentProduct.tagline}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        tagline: e.target.value,
                      })
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Product Image</Label>
                  <ImageUpload
                    value={currentProduct.image}
                    onChange={(url) =>
                      setCurrentProduct({
                        ...currentProduct,
                        image: url,
                      })
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Adding..." : "Add Product"}
                  </Button>
                </div>

                {products.length > 0 && (
                  <Button
                    type="button"
                    onClick={handleFinish}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Saving..." : "Finish and View Brand"}
                  </Button>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 