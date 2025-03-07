"use client"

import type React from "react"

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
import { Upload, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProductSelector } from "@/components/dashboard/product-selector"
import { ColorPicker } from "@/components/dashboard/color-picker"

const formSchema = z.object({
  storeName: z.string().min(3, {
    message: "Store name must be at least 3 characters.",
  }),
  urlName: z
    .string()
    .min(3, {
      message: "URL name must be at least 3 characters.",
    })
    .regex(/^[a-zA-Z0-9-]+$/, {
      message: "URL can only contain letters, numbers, and hyphens.",
    }),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters.",
    })
    .max(500, {
      message: "Description must not exceed 500 characters.",
    }),
  colors: z
    .array(z.string())
    .min(1, {
      message: "Please select at least one color.",
    })
    .max(3, {
      message: "You can select up to 3 colors.",
    }),
  products: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        basePrice: z.number(),
        profitMargin: z.number().min(0).max(1000),
      }),
    )
    .min(1, {
      message: "Please select at least one product.",
    })
    .max(8, {
      message: "You can select up to 8 products.",
    }),
})

export default function CreateStorePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeName: "",
      urlName: "",
      description: "",
      colors: [],
      products: [],
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!imagePreview) {
      toast({
        title: "Image required",
        description: "Please upload an image for your store.",
        variant: "destructive",
      })
      return
    }

    if (values.products.length === 0) {
      toast({
        title: "Products required",
        description: "Please select at least one product for your store.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // This would be replaced with your actual store creation API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Store submitted for approval!",
        description: "Your store has been submitted and is pending admin approval.",
      })
      router.push("/dashboard?tab=stores")
    }, 1500)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Create Store" text="Create your custom merchandise store" />

      <div className="grid gap-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            All stores require admin approval before they go live. Please ensure your content follows our guidelines.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Store Details</CardTitle>
                <CardDescription>Enter the basic information for your store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Awesome Store" {...field} />
                      </FormControl>
                      <FormDescription>This will be displayed as the title of your store page.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urlName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Name</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <span className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground">
                            perchmerch.com/
                          </span>
                          <Input {...field} className="rounded-l-none" placeholder="my-store" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        This will be the URL of your store. Only letters, numbers, and hyphens are allowed.
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
                      <FormLabel>Store Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your store and products..."
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>This will appear on your store page. Maximum 500 characters.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="colors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Colors</FormLabel>
                      <FormControl>
                        <ColorPicker value={field.value} onChange={(colors) => field.onChange(colors)} max={3} />
                      </FormControl>
                      <FormDescription>Choose up to 3 colors for your store theme.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Store Image</CardTitle>
                <CardDescription>Upload an image for your store</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
                  {imagePreview ? (
                    <div className="relative w-full h-64">
                      <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">
                        Drag and drop your image here or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG or GIF up to 5MB</p>
                    </>
                  )}
                  <Input
                    type="file"
                    className="hidden"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => document.getElementById("image-upload")?.click()}
                  >
                    {imagePreview ? "Change Image" : "Select Image"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Select Products</CardTitle>
                <CardDescription>Choose up to 8 products from Printify to sell in your store</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="products"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ProductSelector
                          selectedProducts={field.value}
                          setSelectedProducts={(products) => field.onChange(products)}
                          maxProducts={8}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit for Approval"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardShell>
  )
}

