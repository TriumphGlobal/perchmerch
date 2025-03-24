"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Link as LinkIcon, X } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Genre {
  id: string
  name: string
  isHidden: boolean
  brandCount: number
  lastModifiedAt: string
  lastModifiedBy: {
    email: string
  } | null
}

interface GenreLink {
  id: string
  sourceGenreId: string
  targetGenreId: string
  createdAt: string
  createdBy: {
    email: string
  }
}

export function GenresList() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [genreLinks, setGenreLinks] = useState<GenreLink[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null)
  const [linkSearchTerm, setLinkSearchTerm] = useState("")

  useEffect(() => {
    fetchGenres()
    fetchGenreLinks()
  }, [])

  const fetchGenres = async () => {
    try {
      const response = await fetch("/api/genres")
      if (!response.ok) throw new Error("Failed to fetch genres")
      const data = await response.json()
      setGenres(data.genres || [])
    } catch (error) {
      console.error("Error fetching genres:", error)
      toast.error("Failed to load genres")
    } finally {
      setLoading(false)
    }
  }

  const fetchGenreLinks = async () => {
    try {
      const response = await fetch("/api/genres/links")
      if (!response.ok) throw new Error("Failed to fetch genre links")
      const data = await response.json()
      setGenreLinks(data.links || [])
    } catch (error) {
      console.error("Error fetching genre links:", error)
      toast.error("Failed to load genre links")
    }
  }

  const handleToggleVisibility = async (genreId: string, isHidden: boolean) => {
    try {
      const response = await fetch(`/api/genres/${genreId}/visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isHidden: !isHidden }),
      })

      if (!response.ok) throw new Error("Failed to update genre visibility")

      await fetchGenres()
      toast.success("Genre visibility updated")
    } catch (error) {
      console.error("Error updating genre visibility:", error)
      toast.error("Failed to update genre visibility")
    }
  }

  const handleCreateLink = async (sourceGenreId: string, targetGenreId: string) => {
    try {
      const response = await fetch("/api/genres/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceGenreId,
          targetGenreId,
        }),
      })

      if (!response.ok) throw new Error("Failed to create genre link")

      await fetchGenreLinks()
      toast.success("Genres linked successfully")
    } catch (error) {
      console.error("Error creating genre link:", error)
      toast.error("Failed to create genre link")
    }
  }

  const handleRemoveLink = async (linkId: string) => {
    try {
      const response = await fetch(`/api/genres/links/${linkId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to remove genre link")

      await fetchGenreLinks()
      toast.success("Genre link removed")
    } catch (error) {
      console.error("Error removing genre link:", error)
      toast.error("Failed to remove genre link")
    }
  }

  const getLinkedGenres = (genreId: string) => {
    const links = genreLinks.filter(
      link => link.sourceGenreId === genreId || link.targetGenreId === genreId
    )
    return links.map(link => {
      const linkedGenreId = link.sourceGenreId === genreId ? link.targetGenreId : link.sourceGenreId
      return {
        genre: genres.find(g => g.id === linkedGenreId),
        linkId: link.id
      }
    }).filter(item => item.genre !== undefined)
  }

  const filteredGenres = genres.filter(genre =>
    genre.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div>Loading genres...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Genre Management</CardTitle>
          <CardDescription>
            Manage platform genres and their relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search genres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-4">
              {filteredGenres.map((genre) => (
                <div
                  key={genre.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{genre.name}</h3>
                      {genre.isHidden && (
                        <Badge variant="secondary">Hidden</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {genre.brandCount} brands
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {getLinkedGenres(genre.id).map(({ genre: linkedGenre, linkId }) => (
                        linkedGenre && (
                          <Badge key={linkId} variant="outline" className="flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />
                            {linkedGenre.name}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => handleRemoveLink(linkId)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        )
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Link Genre
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Link Genre</DialogTitle>
                          <DialogDescription>
                            Link this genre with another to show related brands
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Input
                            placeholder="Search genres to link..."
                            value={linkSearchTerm}
                            onChange={(e) => setLinkSearchTerm(e.target.value)}
                          />
                          <div className="space-y-2">
                            {genres
                              .filter(g => 
                                g.id !== genre.id && 
                                g.name.toLowerCase().includes(linkSearchTerm.toLowerCase()) &&
                                !getLinkedGenres(genre.id).some(link => link.genre?.id === g.id)
                              )
                              .map(g => (
                                <Button
                                  key={g.id}
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => {
                                    handleCreateLink(genre.id, g.id)
                                    setLinkSearchTerm("")
                                  }}
                                >
                                  {g.name}
                                </Button>
                              ))
                            }
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVisibility(genre.id, genre.isHidden)}
                    >
                      {genre.isHidden ? "Show" : "Hide"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 