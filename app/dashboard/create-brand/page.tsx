"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Upload } from "lucide-react"

const brandFormSchema = z.object({
  brandName: z.string().min(3, {
    message: "Brand name must be at least 3 characters.",
  }),
  subdomain: z
    .string()
    .min(3, {
      message: "Subdomain must be at least 3 characters.",
    })
    .regex(/^[a-zA-Z0-9-]+$/, {
      message: "Subdomain can only contain letters, numbers, and hyphens.",
    }),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters.",
    })
    .max(500, {
      message: "Description must not exceed 500 characters.",
    }),
  tagline: z
    .string()
    .max(100, {
      message: "Tagline must not exceed 100 characters.",
    })
    .optional(),
  socialLinks: z.object({
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    tiktok: z.string().url().optional(),
    youtube: z.string().url().optional(),
  }).optional(),
})

type BrandFormValues = z.infer<typeof brandFormSchema>

export default function CreateBrandPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [brandImage, setBrandImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      brandName: "",
      subdomain: "",
      description: "",
      tagline: "",
      socialLinks: {
        instagram: "",
        twitter: "",
        tiktok: "",
        youtube: "",
      },
    },
  })

  const handleImageUpload = async (file: File) => {
    // Check image dimensions and size
    const img = new Image()
    img.src = URL.createObjectURL(file)
    await new Promise((resolve) => {
      img.onload = resolve
    })

    if (img.width < 1200 || img.height < 630) {
      toast({
        title: "Image too small",
        description: "Brand image should be at least 1200x630 pixels for optimal social sharing.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Brand image should be less than 5MB.",
        variant: "destructive",
      })
      return
    }

    // In a real application, you would upload this to your storage service
    setBrandImage(URL.createObjectURL(file))
  }

  async function onSubmit(data: BrandFormValues) {
    if (!brandImage) {
      toast({
        title: "Brand image required",
        description: "Please upload a brand image.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Here you would:
      // 1. Upload the brand image to your storage service
      // 2. Create the brand record in your database
      // 3. Set up the subdomain if needed
      // 4. Create initial store settings

      // For now, we'll simulate the process
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Brand created!",
        description: "Your brand has been created. Let's set up your products next.",
      })

      // Navigate to product selection
      router.push("/dashboard/create-store")
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Create Your Brand"
        description="Set up your brand identity and customize your store's appearance."
      />
      <div className="grid gap-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Brand Details</CardTitle>
                <CardDescription>
                  This information will be used to create your custom storefront on PerchMerch.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative h-40 w-80 overflow-hidden rounded-lg border">
                    {brandImage ? (
                      <Image
                        src={brandImage}
                        alt="Brand preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("brandImage")?.click()}
                  >
                    Upload Brand Image
                  </Button>
                  <input
                    id="brandImage"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 1200x630 pixels (max 5MB)
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="brandName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Awesome Brand" {...field} />
                      </FormControl>
                      <FormDescription>
                        This will be the name of your store.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subdomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store URL</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Input {...field} />
                          <span className="ml-2 text-muted-foreground">.perchmerch.com</span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Choose a unique URL for your store.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tagline</FormLabel>
                      <FormControl>
                        <Input placeholder="Your brand's catchy tagline" {...field} />
                      </FormControl>
                      <FormDescription>
                        A short, memorable phrase that describes your brand.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell your customers about your brand..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This will appear on your store's homepage and in search results.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Social Media Links</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="socialLinks.instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram</FormLabel>
                          <FormControl>
                            <Input placeholder="https://instagram.com/yourbrand" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="socialLinks.twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter</FormLabel>
                          <FormControl>
                            <Input placeholder="https://twitter.com/yourbrand" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="socialLinks.tiktok"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TikTok</FormLabel>
                          <FormControl>
                            <Input placeholder="https://tiktok.com/@yourbrand" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="socialLinks.youtube"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>YouTube</FormLabel>
                          <FormControl>
                            <Input placeholder="https://youtube.com/@yourbrand" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Brand & Continue"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardShell>
  )
} 