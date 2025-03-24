"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { X } from "lucide-react"

interface Brand {
  id: string
  name: string
  brandId: string
  description: string | null
  isHidden: boolean
  genres: Array<{
    id: string
    name: string
  }>
}

interface BrandSettingsProps {
  brand: Brand
  onUpdate: () => void
}

export function BrandSettings({ brand, onUpdate }: BrandSettingsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(brand.name)
  const [description, setDescription] = useState(brand.description || "")
  const [isHidden, setIsHidden] = useState(brand.isHidden)
  const [genres, setGenres] = useState<Array<{ id: string; name: string }>>([])
  const [genreSearchTerm, setGenreSearchTerm] = useState("")
  const [isGenresLoading, setIsGenresLoading] = useState(false)

  useEffect(() => {
    fetchGenres()
  }, [])

  const fetchGenres = async () => {
    setIsGenresLoading(true)
    try {
      const response = await fetch("/api/genres")
      const data = await response.json()
      if (data.success) {
        setGenres(data.genres.filter((genre: any) => !genre.isHidden))
      }
    } catch (error) {
      console.error("Error fetching genres:", error)
      toast.error("Failed to fetch genres")
    } finally {
      setIsGenresLoading(false)
    }
  }

  const handleAddGenre = async (genreId: string) => {
    if (brand.genres.length >= 3) {
      toast.error("You can only add up to 3 genres")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/brands/${brand.brandId}/genres`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ genreId }),
      })

      if (!response.ok) {
        throw new Error("Failed to add genre")
      }

      toast.success("Genre added successfully")
      onUpdate()
    } catch (error) {
      console.error("Error adding genre:", error)
      toast.error("Failed to add genre")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveGenre = async (genreId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/brands/${brand.brandId}/genres/${genreId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove genre")
      }

      toast.success("Genre removed successfully")
      onUpdate()
    } catch (error) {
      console.error("Error removing genre:", error)
      toast.error("Failed to remove genre")
    } finally {
      setLoading(false)
    }
  }

  const getFilteredGenres = () => {
    if (!genreSearchTerm) return []
    const lowerTerm = genreSearchTerm.toLowerCase()
    return genres.filter(genre => 
      genre.name.toLowerCase().includes(lowerTerm) &&
      !brand.genres.some(bg => bg.id === genre.id)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/brands/${brand.brandId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          isHidden,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update brand")
      }

      toast.success("Brand settings updated")
      onUpdate()
    } catch (error) {
      console.error("Error updating brand:", error)
      toast.error("Failed to update brand settings")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this brand? This action cannot be undone.")) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/brands/${brand.brandId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete brand")
      }

      toast.success("Brand deleted")
      router.push("/brands")
    } catch (error) {
      console.error("Error deleting brand:", error)
      toast.error("Failed to delete brand")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand Settings</CardTitle>
          <CardDescription>
            Update your brand information and visibility settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="hidden"
                checked={isHidden}
                onCheckedChange={setIsHidden}
                disabled={loading}
              />
              <Label htmlFor="hidden">Hide brand from public view</Label>
            </div>
            <Button type="submit" disabled={loading}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Genres</CardTitle>
          <CardDescription>
            Add up to 3 genres to your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {brand.genres.map((genre) => (
                <div key={genre.id} className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full">
                  <span>{genre.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveGenre(genre.id)}
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            {brand.genres.length < 3 && (
              <div className="space-y-2">
                <Input
                  placeholder="Search genres..."
                  value={genreSearchTerm}
                  onChange={(e) => setGenreSearchTerm(e.target.value)}
                  disabled={loading || isGenresLoading}
                />
                {genreSearchTerm && getFilteredGenres().length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {getFilteredGenres().map((genre) => (
                      <Button
                        key={genre.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddGenre(genre.id)}
                        disabled={loading}
                      >
                        {genre.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            Delete Brand
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 