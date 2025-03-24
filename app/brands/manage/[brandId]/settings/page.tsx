"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "../../../../../components/ui/alert"
import { Button } from "../../../../../components/ui/button"
import { Input } from "../../../../../components/ui/input"
import { Label } from "../../../../../components/ui/label"
import { Textarea } from "../../../../../components/ui/textarea"
import { AlertCircle, Loader2, Plus } from "lucide-react"
import { usePerchAuth } from "../../../../../hooks/usePerchAuth"
import { ImageUpload } from "../../../../../components/image-upload"
import { toast } from "../../../../../components/ui/use-toast"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../../../../../components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "../../../../../lib/utils"

interface Genre {
  id: string
  name: string
  isHidden: boolean
}

interface Brand {
  id: string
  name: string
  description: string
  tagline: string | null
  imageUrl: string | null
  isApproved: boolean
  isHidden: boolean
  colors: string[]
  genres: Genre[]
  owner: {
    id: string
    email: string
    name: string | null
  }
  socialMedia: {
    website: string | null
    facebook: string | null
    twitter: string | null
    telegram: string | null
    customLink1: string | null
    customLink2: string | null
    customLink3: string | null
  } | null
}

export default function BrandSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { isSignedIn, getToken, isLoaded } = usePerchAuth()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([])
  const [genreSearch, setGenreSearch] = useState("")
  const [isGenrePopoverOpen, setIsGenrePopoverOpen] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [tagline, setTagline] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error("Not authenticated")
        }

        // Fetch brand and genres in parallel
        const [brandResponse, genresResponse] = await Promise.all([
          fetch(`/api/brands/${params.brandId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/genres', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        if (!brandResponse.ok || !genresResponse.ok) {
          if (brandResponse.status === 401 || genresResponse.status === 401) {
            router.push("/sign-in")
            return
          }
          throw new Error("Failed to fetch data")
        }

        const [brandData, genresData] = await Promise.all([
          brandResponse.json(),
          genresResponse.json()
        ])

        setBrand(brandData.brand)
        setGenres(genresData.genres)
        setSelectedGenres(brandData.brand.genres || [])

        // Set form state
        setName(brandData.brand.name)
        setDescription(brandData.brand.description || "")
        setTagline(brandData.brand.tagline || "")
        setImageUrl(brandData.brand.imageUrl || "")
      } catch (error) {
        setError("Failed to load data")
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.brandId && isLoaded && isSignedIn) {
      fetchData()
    } else if (isLoaded && !isSignedIn) {
      router.push("/sign-in")
    }
  }, [params.brandId, isLoaded, isSignedIn, getToken, router])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const token = await getToken()
      if (!token) throw new Error("Not authenticated")

      const response = await fetch(`/api/brands/${params.brandId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          tagline,
          imageUrl,
          genres: selectedGenres.map(g => g.id)
        })
      })

      if (!response.ok) {
        throw new Error("Failed to update brand")
      }

      toast({
        title: "Success",
        description: "Brand settings updated successfully",
      })
    } catch (error) {
      console.error("Error updating brand:", error)
      toast({
        title: "Error",
        description: "Failed to update brand settings",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateGenre = async () => {
    try {
      const token = await getToken()
      if (!token) throw new Error("Not authenticated")

      const response = await fetch('/api/genres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: genreSearch })
      })

      if (!response.ok) {
        throw new Error("Failed to create genre")
      }

      const newGenre = await response.json()
      setGenres(prev => [...prev, newGenre])
      setSelectedGenres(prev => [...prev, newGenre])
      setGenreSearch("")
      setIsGenrePopoverOpen(false)

      toast({
        title: "Success",
        description: "New genre created and added to brand",
      })
    } catch (error) {
      console.error("Error creating genre:", error)
      toast({
        title: "Error",
        description: "Failed to create genre",
        variant: "destructive"
      })
    }
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading settings...</span>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error || !brand) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to Load</AlertTitle>
                <AlertDescription>
                  {error || "Brand not found"}
                </AlertDescription>
              </Alert>
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Brand Settings</CardTitle>
            <CardDescription>
              Update your brand information and appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter brand name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="A short, catchy tagline"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your brand"
              />
            </div>

            <div className="space-y-2">
              <Label>Brand Image</Label>
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                placeholder="Upload your brand image"
              />
            </div>

            <div className="space-y-2">
              <Label>Genres</Label>
              <Popover open={isGenrePopoverOpen} onOpenChange={setIsGenrePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isGenrePopoverOpen}
                    className="w-full justify-between"
                  >
                    {selectedGenres.length > 0
                      ? `${selectedGenres.length} genres selected`
                      : "Select genres..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search genres..."
                      value={genreSearch}
                      onValueChange={setGenreSearch}
                    />
                    <CommandEmpty>
                      <div className="p-2">
                        <p className="text-sm text-muted-foreground">No genres found</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={handleCreateGenre}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create "{genreSearch}"
                        </Button>
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {genres.map((genre) => (
                        <CommandItem
                          key={genre.id}
                          onSelect={() => {
                            setSelectedGenres(prev => {
                              const isSelected = prev.some(g => g.id === genre.id)
                              if (isSelected) {
                                return prev.filter(g => g.id !== genre.id)
                              }
                              return [...prev, genre]
                            })
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedGenres.some(g => g.id === genre.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {genre.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedGenres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedGenres.map((genre) => (
                    <div
                      key={genre.id}
                      className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1"
                    >
                      {genre.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setSelectedGenres(prev => prev.filter(g => g.id !== genre.id))}
                      >
                        <AlertCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 