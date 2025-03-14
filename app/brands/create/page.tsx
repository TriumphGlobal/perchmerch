"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, Plus, X, Facebook, Twitter, Link as LinkIcon } from "lucide-react"
import { ImageUpload } from "@/components/image-upload"

interface Genre {
  id: string
  name: string
  isHidden: boolean
}

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
}

export default function CreateBrandPage() {
  const router = useRouter()
  const { userId } = useAuth()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [tagline, setTagline] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [facebook, setFacebook] = useState("")
  const [twitter, setTwitter] = useState("")
  const [website, setWebsite] = useState("")
  const [telegram, setTelegram] = useState("")
  const [customLink1, setCustomLink1] = useState("")
  const [customLink2, setCustomLink2] = useState("")
  const [customLink3, setCustomLink3] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([])
  const [newGenreName, setNewGenreName] = useState("")

  useEffect(() => {
    fetchGenres()
  }, [])

  const fetchGenres = async () => {
    try {
      const response = await fetch("/api/genres")
      const data = await response.json()
      if (data.success) {
        // Filter out hidden genres
        setGenres(data.genres.filter((genre: Genre) => !genre.isHidden))
      }
    } catch (error) {
      console.error("Error fetching genres:", error)
      toast({
        title: "Error",
        description: "Failed to fetch genres",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          description,
          tagline,
          imageUrl,
          genreIds: selectedGenres.map(genre => genre.id),
          socialMedia: {
            facebook,
            twitter,
            website,
            telegram,
            customLink1,
            customLink2,
            customLink3
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create brand")
      }

      setSuccess(true)
      toast({
        title: "Success",
        description: "Brand created successfully! It will be visible after approval."
      })

      // Redirect to brand page after 2 seconds
      setTimeout(() => {
        router.push(`/brands/${data.brand.brandId}`)
      }, 2000)
    } catch (error) {
      console.error("Error creating brand:", error)
      setError(error instanceof Error ? error.message : "Failed to create brand")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create brand",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddGenre = async () => {
    if (!newGenreName.trim()) return

    try {
      const response = await fetch("/api/genres", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newGenreName })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create genre")
      }

      toast({
        title: "Success",
        description: "Genre created successfully!"
      })

      setNewGenreName("")
      fetchGenres() // Refresh genres list
    } catch (error) {
      console.error("Error creating genre:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create genre",
        variant: "destructive"
      })
    }
  }

  const handleSelectGenre = (genre: Genre) => {
    if (selectedGenres.length >= 3) {
      toast({
        title: "Error",
        description: "You can only select up to 3 genres",
        variant: "destructive"
      })
      return
    }
    const isSelected = selectedGenres.some(g => g.id === genre.id)
    if (!isSelected) {
      setSelectedGenres([...selectedGenres, genre])
    }
  }

  const handleRemoveGenre = (genreId: string) => {
    setSelectedGenres(selectedGenres.filter(g => g.id !== genreId))
  }

  const renderGenreSection = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selectedGenres.map(genre => (
          <Badge key={genre.id} variant="secondary" className="text-sm">
            {genre.name}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-2"
              onClick={() => handleRemoveGenre(genre.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newGenreName}
          onChange={(e) => setNewGenreName(e.target.value)}
          placeholder="Enter new genre name..."
          className="max-w-[200px]"
        />
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleAddGenre}
          disabled={!newGenreName.trim()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {genres.map(genre => (
          <Button
            key={genre.id}
            variant="outline"
            size="sm"
            onClick={() => handleSelectGenre(genre)}
            disabled={!!selectedGenres.find(g => g.id === genre.id)}
          >
            {genre.name}
          </Button>
        ))}
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Brand</CardTitle>
          <CardDescription>
            Fill out the details below to create your brand. Your brand will be reviewed by our team before it becomes visible on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Your brand has been created and is pending approval. You can start adding products now.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Brand Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your brand name"
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A short, catchy tagline for your brand"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your brand..."
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Brand Image</Label>
            <ImageUpload
              value={imageUrl}
              onChange={(url: string) => setImageUrl(url)}
            />
          </div>
          <div className="space-y-4">
            <Label>Social Media Links</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    <Facebook className="h-4 w-4" />
                  </span>
                  <Input
                    id="facebook"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="Facebook URL"
                    className="rounded-l-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter/X</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    <Twitter className="h-4 w-4" />
                  </span>
                  <Input
                    id="twitter"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="Twitter/X URL"
                    className="rounded-l-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    <LinkIcon className="h-4 w-4" />
                  </span>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Website URL"
                    className="rounded-l-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram">Telegram</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    t
                  </span>
                  <Input
                    id="telegram"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="Telegram URL"
                    className="rounded-l-none"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Label>Custom Links</Label>
              <div className="space-y-2">
                <Input
                  value={customLink1}
                  onChange={(e) => setCustomLink1(e.target.value)}
                  placeholder="Custom Link 1"
                />
              </div>
              <div className="space-y-2">
                <Input
                  value={customLink2}
                  onChange={(e) => setCustomLink2(e.target.value)}
                  placeholder="Custom Link 2"
                />
              </div>
              <div className="space-y-2">
                <Input
                  value={customLink3}
                  onChange={(e) => setCustomLink3(e.target.value)}
                  placeholder="Custom Link 3"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Genres (up to 3)</Label>
            {renderGenreSection()}
          </div>
          <Button type="submit" disabled={isLoading || !name || !description}>
            Create Brand
          </Button>
        </CardContent>
      </Card>
    </form>
  )
} 