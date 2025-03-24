"use client"

import { useState } from "react"
import { Brand } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface SettingsProps {
  brand: Brand & {
    products: any[]
    brandAccess: any[]
    socialMedia: any[]
    genres: any[]
    _count: {
      products: number
    }
  }
}

export function Settings({ brand }: SettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: brand.name,
    description: brand.description || "",
    imageUrl: brand.imageUrl || "",
    isHidden: brand.isHidden || false,
    socialMedia: brand.socialMedia.reduce((acc: any, sm: any) => {
      acc[sm.platform] = sm.url
      return acc
    }, {
      twitter: "",
      instagram: "",
      facebook: "",
      website: ""
    })
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/brands/${brand.brandId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          imageUrl: formData.imageUrl,
          isHidden: formData.isHidden,
          socialMedia: Object.entries(formData.socialMedia).map(([platform, url]) => ({
            platform,
            url: url as string
          }))
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update brand settings")
      }

      toast.success("Brand settings updated successfully")
    } catch (error) {
      toast.error("Failed to update brand settings")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Update your brand's basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Brand Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="imageUrl">Brand Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="hidden"
              checked={formData.isHidden}
              onCheckedChange={(checked) => setFormData({ ...formData, isHidden: checked })}
            />
            <Label htmlFor="hidden">Hide brand from public view</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
          <CardDescription>
            Connect your brand's social media accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(formData.socialMedia).map(([platform, url]) => (
            <div key={platform}>
              <Label htmlFor={platform} className="capitalize">{platform}</Label>
              <Input
                id={platform}
                type="url"
                value={url as string}
                onChange={(e) => setFormData({
                  ...formData,
                  socialMedia: {
                    ...formData.socialMedia,
                    [platform]: e.target.value
                  }
                })}
                placeholder={`https://${platform}.com/yourbrand`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  )
} 