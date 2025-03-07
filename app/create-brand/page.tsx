"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

// Function to generate a slug from a string
function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export default function CreateBrandPage() {
  const router = useRouter()
  const { user, addBrand } = useAuth()
  
  const [brandName, setBrandName] = useState("")
  const [brandDescription, setBrandDescription] = useState("")
  const [brandImage, setBrandImage] = useState<string>("")
  const [brandSlug, setBrandSlug] = useState("")
  const [isNameValid, setIsNameValid] = useState(true)
  const [isSlugValid, setIsSlugValid] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/create-brand")
    }
  }, [user, router])
  
  // Generate slug from brand name
  useEffect(() => {
    if (brandName) {
      setBrandSlug(generateSlug(brandName))
    }
  }, [brandName])
  
  // Validate brand name
  useEffect(() => {
    setIsNameValid(brandName.length >= 2 && brandName.length <= 50)
  }, [brandName])
  
  // Validate slug
  useEffect(() => {
    setIsSlugValid(brandSlug.length >= 2 && /^[a-z0-9\-]+$/.test(brandSlug))
  }, [brandSlug])
  
  const handleImageUpload = (imageUrl: string) => {
    setBrandImage(imageUrl)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return
    
    // Validate form
    if (!brandName || !brandDescription) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }
    
    if (!isNameValid) {
      toast({
        title: "Invalid brand name",
        description: "Brand name must be between 2 and 50 characters",
        variant: "destructive",
      })
      return
    }
    
    if (!isSlugValid) {
      toast({
        title: "Invalid URL",
        description: "Brand URL can only contain lowercase letters, numbers, and hyphens",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsLoading(true)
      
      // Create the brand
      await addBrand({
        id: crypto.randomUUID(),
        name: brandName,
        description: brandDescription,
        slug: brandSlug,
        mainImage: brandImage,
        ownerId: user?.id || "",
        products: [],
      })
      
      toast({
        title: "Brand created",
        description: "Your brand has been created successfully",
      })
      
      // Redirect to the brand management page
      router.push(`/${brandSlug}/manage`)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create brand",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="container max-w-xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create Your Brand</CardTitle>
          <CardDescription>
            Set up your brand identity and start selling products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                placeholder="Enter your brand name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
                maxLength={50}
              />
              {!isNameValid && brandName && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Brand name must be between 2 and 50 characters
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brandSlug">Brand URL</Label>
              <div className="flex items-center">
                <span className="text-muted-foreground mr-1">perchmerch.com/</span>
                <Input
                  id="brandSlug"
                  placeholder="your-brand-url"
                  value={brandSlug}
                  onChange={(e) => setBrandSlug(e.target.value.toLowerCase())}
                  required
                  pattern="^[a-z0-9\-]+$"
                  title="URL can only contain lowercase letters, numbers, and hyphens"
                />
              </div>
              {!isSlugValid && brandSlug && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  URL can only contain lowercase letters, numbers, and hyphens
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brandDescription">Brand Description</Label>
              <Textarea
                id="brandDescription"
                placeholder="Describe your brand (max 500 characters)"
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                required
                maxLength={500}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground text-right">
                {brandDescription.length}/500
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Brand Image</Label>
              <ImageUpload
                value={brandImage}
                onChange={handleImageUpload}
                placeholder="Upload your brand logo or image"
              />
              <p className="text-xs text-muted-foreground">
                Recommended size: 500x500px. Max size: 5MB.
              </p>
            </div>
            
            <Separator />
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                After creating your brand, you'll be able to add products and customize your brand page.
              </AlertDescription>
            </Alert>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Brand..." : "Create Brand"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 