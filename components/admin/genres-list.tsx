"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { 
  MoreVertical, 
  Ban, 
  Eye, 
  Edit2,
  CheckCircle,
  Plus
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Genre {
  id: string
  name: string
  isHidden: boolean
  brandCount: number
  createdAt: string
  lastModifiedAt: string
  lastModifiedBy: {
    id: string
    name: string | null
    email: string
  } | null
}

export function GenresList() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [newGenreName, setNewGenreName] = useState("")
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchGenres = async () => {
    try {
      const response = await fetch("/api/admin/genres")
      const data = await response.json()
      if (data.success) {
        setGenres(data.genres)
      }
    } catch (error) {
      console.error("Error fetching genres:", error)
      toast({
        title: "Error",
        description: "Failed to fetch genres",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGenres()
  }, [])

  const handleCreateGenre = async () => {
    try {
      const response = await fetch("/api/admin/genres", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newGenreName })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create genre")
      }

      toast({
        title: "Success",
        description: "Genre has been created"
      })

      setNewGenreName("")
      setIsDialogOpen(false)
      fetchGenres()
    } catch (error) {
      console.error("Error creating genre:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create genre",
        variant: "destructive"
      })
    }
  }

  const handleEditGenre = async (genreId: string, newName: string) => {
    try {
      const response = await fetch(`/api/admin/genres/${genreId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newName })
      })

      if (!response.ok) {
        throw new Error("Failed to update genre")
      }

      toast({
        title: "Success",
        description: "Genre has been updated"
      })

      setEditingGenre(null)
      fetchGenres()
    } catch (error) {
      console.error("Error updating genre:", error)
      toast({
        title: "Error",
        description: "Failed to update genre",
        variant: "destructive"
      })
    }
  }

  const handleToggleVisibility = async (genreId: string, isHidden: boolean) => {
    try {
      const response = await fetch(`/api/admin/genres/${genreId}/visibility`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isHidden: !isHidden })
      })

      if (!response.ok) {
        throw new Error("Failed to update genre visibility")
      }

      toast({
        title: "Success",
        description: `Genre has been ${!isHidden ? "hidden" : "unhidden"}`
      })

      fetchGenres()
    } catch (error) {
      console.error("Error updating genre visibility:", error)
      toast({
        title: "Error",
        description: "Failed to update genre visibility",
        variant: "destructive"
      })
    }
  }

  const filteredGenres = genres.filter(genre => 
    genre.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>All Genres</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Genre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Genre</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Genre Name</Label>
                  <Input
                    id="name"
                    value={newGenreName}
                    onChange={(e) => setNewGenreName(e.target.value)}
                    placeholder="Enter genre name..."
                  />
                </div>
                <Button onClick={handleCreateGenre} disabled={!newGenreName.trim()}>
                  Create Genre
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-4">
          <Input
            placeholder="Search genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Genre Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Brands</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading genres...</TableCell>
              </TableRow>
            ) : filteredGenres.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No genres found</TableCell>
              </TableRow>
            ) : (
              filteredGenres.map((genre) => (
                <TableRow key={genre.id} className={genre.isHidden ? "opacity-60" : ""}>
                  <TableCell className="font-medium">
                    {editingGenre?.id === genre.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editingGenre.name}
                          onChange={(e) => setEditingGenre({ ...editingGenre, name: e.target.value })}
                          className="max-w-[200px]"
                        />
                        <Button 
                          size="sm"
                          onClick={() => handleEditGenre(genre.id, editingGenre.name)}
                        >
                          Save
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingGenre(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      genre.name
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={genre.isHidden ? "secondary" : "success"}>
                      {genre.isHidden ? "Hidden" : "Visible"}
                    </Badge>
                  </TableCell>
                  <TableCell>{genre.brandCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{new Date(genre.lastModifiedAt).toLocaleDateString()}</span>
                      {genre.lastModifiedBy && (
                        <span className="text-xs text-muted-foreground">
                          by {genre.lastModifiedBy.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.location.href = `/genres/${genre.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Brands
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingGenre(genre)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Name
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleVisibility(genre.id, genre.isHidden)}>
                          {genre.isHidden ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Show Genre
                            </>
                          ) : (
                            <>
                              <Ban className="h-4 w-4 mr-2" />
                              Hide Genre
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 