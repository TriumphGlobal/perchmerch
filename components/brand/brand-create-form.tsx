"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { HexColorPicker } from "react-colorful"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "../../components/image-upload"
import { toast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const createBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  description: z.string().optional(),
  tagline: z.string().optional(),
  imageUrl: z.string().optional(),
  colors: z.array(z.string()).optional(),
  website: z.string().optional().or(z.literal("")),
  facebook: z.string()
    .refine(
      (val) => {
        if (!val) return true // Allow empty
        try {
          const url = new URL(val)
          return url.hostname.endsWith('facebook.com')
        } catch {
          return false
        }
      },
      "Must be a valid Facebook URL"
    )
    .optional()
    .or(z.literal("")),
  instagram: z.string()
    .refine(
      (val) => {
        if (!val) return true // Allow empty
        try {
          const url = new URL(val)
          return url.hostname.endsWith('instagram.com')
        } catch {
          return false
        }
      },
      "Must be a valid Instagram URL"
    )
    .optional()
    .or(z.literal("")),
  twitter: z.string()
    .refine(
      (val) => {
        if (!val) return true // Allow empty
        // Check if it's a valid URL
        try {
          const url = new URL(val)
          return url.hostname.endsWith('twitter.com') || url.hostname.endsWith('x.com')
        } catch {
          // If not URL, check if it's a valid handle (no @ needed)
          return /^[A-Za-z0-9_]{1,15}$/.test(val)
        }
      },
      "Must be a valid Twitter handle or URL"
    )
    .transform((val) => {
      if (!val) return "" // Return empty string if no value
      // If it's already a URL, return as is
      try {
        new URL(val)
        return val
      } catch {
        // If it's a handle, convert to URL
        return `https://twitter.com/${val}`
      }
    })
    .optional(),
  telegram: z.string()
    .refine(
      (val) => {
        if (!val) return true // Allow empty
        try {
          const url = new URL(val)
          return url.hostname === 't.me' || url.hostname.endsWith('telegram.me')
        } catch {
          return false
        }
      },
      "Must be a valid Telegram URL"
    )
    .optional()
    .or(z.literal("")),
  customLink1: z.string().optional().or(z.literal("")),
  customLink2: z.string().optional().or(z.literal("")),
  customLink3: z.string().optional().or(z.literal("")),
  brandId: z.string().optional()
})

type FormData = z.infer<typeof createBrandSchema>

interface BrandCreateFormProps {
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
}

const PRESET_COLORS = {
  monochrome: ['#FFFFFF', '#D9D9D9', '#808080', '#000000'],
  red: ['#FFE5E5', '#FF8080', '#FF2424', '#CC0000'],
  blue: ['#E5F0FF', '#80B3FF', '#2477FF', '#0052CC'],
  green: ['#E5FFE5', '#80FF80', '#24FF24', '#00CC00'],
  purple: ['#F0E5FF', '#B380FF', '#7024FF', '#4400CC'],
  orange: ['#FFF0E5', '#FFB380', '#FF7024', '#CC4400'],
  teal: ['#E5FFFF', '#80FFFF', '#24FFFF', '#00CCCC'],
  pink: ['#FFE5F0', '#FF80B3', '#FF2477', '#CC0052']
}

export default function BrandCreateForm({ user }: BrandCreateFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentColor, setCurrentColor] = useState("#000000")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      colors: [],
      facebook: "",
      instagram: "",
      twitter: "",
      website: "",
      telegram: "",
      customLink1: "",
      customLink2: "",
      customLink3: ""
    }
  })

  const colors = watch("colors")

  const addColor = (color: string) => {
    const currentColors = watch("colors") || []
    if (!currentColors.includes(color)) {
      setValue("colors", [...currentColors, color])
    }
  }

  const removeColor = (colorToRemove: string) => {
    const currentColors = watch("colors") || []
    setValue("colors", currentColors.filter(color => color !== colorToRemove))
  }

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)

      // Transform Twitter handle to URL if needed
      const twitterUrl = data.twitter ? (
        data.twitter.startsWith('http') ? data.twitter : `https://twitter.com/${data.twitter}`
      ) : null

      const brandData = {
        ...data,
        // Ensure social media fields are properly formatted
        website: data.website || null,
        facebook: data.facebook || null,
        twitter: twitterUrl,
        telegram: data.telegram || null,
        customLink1: data.customLink1 || null,
        customLink2: data.customLink2 || null,
        customLink3: data.customLink3 || null
      }

      const response = await fetch("/api/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(brandData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create brand")
      }

      const result = await response.json()

      toast({
        title: "Success!",
        description: "Your brand has been created and is pending approval."
      })

      router.push(`/brands/manage/${result.brand.brandId}`)
    } catch (error) {
      console.error("Error creating brand:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create brand",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Brand Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Brand Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter your brand name"
              disabled={isLoading}
            />
            {errors.name && (
              <Alert variant="destructive">
                <AlertDescription>{errors.name.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandId">Custom URL</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">localhost:3000/</span>
              <Input
                id="brandId"
                {...register("brandId")}
                placeholder="Custom URL (optional)"
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Leave empty to auto-generate from brand name
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              {...register("tagline")}
              placeholder="A short, catchy tagline for your brand"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Tell us about your brand..."
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Brand Colors (Select up to 3)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {colors?.map((color) => (
                <div
                  key={color}
                  className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm">{color}</span>
                  <button
                    type="button"
                    onClick={() => removeColor(color)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-8 gap-1 mb-4">
              {Object.entries(PRESET_COLORS).map(([colorName, shades]) => (
                <div key={colorName} className="flex flex-col gap-0.5">
                  {shades.map((shade) => (
                    <button
                      key={shade}
                      type="button"
                      className={`w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform ${
                        colors?.includes(shade) ? 'ring-2 ring-black' : ''
                      }`}
                      style={{ backgroundColor: shade }}
                      onClick={() => {
                        if (colors?.includes(shade)) {
                          removeColor(shade)
                        } else if ((colors?.length || 0) < 3) {
                          addColor(shade)
                        } else {
                          toast({
                            title: "Color limit reached",
                            description: "You can only select up to 3 colors",
                            variant: "destructive"
                          })
                        }
                      }}
                      disabled={isLoading || (colors?.length === 3 && !colors?.includes(shade))}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-[200px]"
                    disabled={isLoading || (colors?.length || 0) >= 3}
                  >
                    Custom Color
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker
                    color={currentColor}
                    onChange={setCurrentColor}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: currentColor }}
                    />
                    <Input
                      value={currentColor}
                      onChange={(e) => setCurrentColor(e.target.value)}
                      className="w-[120px] mx-2"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if ((colors?.length || 0) < 3) {
                          addColor(currentColor)
                        } else {
                          toast({
                            title: "Color limit reached",
                            description: "You can only select up to 3 colors",
                            variant: "destructive"
                          })
                        }
                      }}
                      size="sm"
                      disabled={isLoading || (colors?.length || 0) >= 3}
                    >
                      Add
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              {colors?.length === 3 && (
                <p className="text-sm text-muted-foreground">
                  Maximum 3 colors selected
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Brand Image</Label>
            <ImageUpload
              value={watch("imageUrl") || ""}
              onChange={(url: string) => setValue("imageUrl", url)}
              placeholder="Upload your brand image"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Media Card */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...register("website")}
              placeholder="https://..."
              disabled={isLoading}
            />
            {errors.website && (
              <Alert variant="destructive">
                <AlertDescription>{errors.website.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              {...register("facebook")}
              placeholder="https://facebook.com/..."
              disabled={isLoading}
            />
            {errors.facebook && (
              <Alert variant="destructive">
                <AlertDescription>{errors.facebook.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              {...register("instagram")}
              placeholder="https://instagram.com/..."
              disabled={isLoading}
            />
            {errors.instagram && (
              <Alert variant="destructive">
                <AlertDescription>{errors.instagram.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter</Label>
            <Input
              id="twitter"
              {...register("twitter")}
              placeholder="@handle or https://twitter.com/..."
              disabled={isLoading}
            />
            {errors.twitter && (
              <Alert variant="destructive">
                <AlertDescription>{errors.twitter.message}</AlertDescription>
              </Alert>
            )}
            <p className="text-sm text-muted-foreground">
              Enter your Twitter handle (without @) or full profile URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram">Telegram</Label>
            <Input
              id="telegram"
              {...register("telegram")}
              placeholder="https://t.me/..."
              disabled={isLoading}
            />
            {errors.telegram && (
              <Alert variant="destructive">
                <AlertDescription>{errors.telegram.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customLink1">Custom Link 1</Label>
            <Input
              id="customLink1"
              {...register("customLink1")}
              placeholder="https://..."
              disabled={isLoading}
            />
            {errors.customLink1 && (
              <Alert variant="destructive">
                <AlertDescription>{errors.customLink1.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customLink2">Custom Link 2</Label>
            <Input
              id="customLink2"
              {...register("customLink2")}
              placeholder="https://..."
              disabled={isLoading}
            />
            {errors.customLink2 && (
              <Alert variant="destructive">
                <AlertDescription>{errors.customLink2.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customLink3">Custom Link 3</Label>
            <Input
              id="customLink3"
              {...register("customLink3")}
              placeholder="https://..."
              disabled={isLoading}
            />
            {errors.customLink3 && (
              <Alert variant="destructive">
                <AlertDescription>{errors.customLink3.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create Brand"}
        </Button>
      </div>
    </form>
  )
} 