"use client"

import { useEffect, useState, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Users, Tag, Flag, Settings, Loader2, CheckCircle, XCircle, AlertTriangle, Trash2, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/components/ui/use-toast"
import { BrandAnalytics } from "@/components/admin/brand-analytics"

interface Genre {
  id: string
  name: string
  createdBy: string
  isHidden?: boolean
  isDeleted?: boolean
  bannedReason?: string
  bannedAt?: string
  bannedBy?: string
}

interface Brand {
  id: string
  name: string
  description?: string
  isApproved?: boolean
  genres?: string[]
  isDeleted?: boolean
  deletedAt?: string
  originalUserId?: string
}

export default function PlatformDashboard() {
  const { user, isLoaded } = useUser()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasCheckedRole = useRef(false)
  const auth = useAuth()

  // Genre Management State
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null)
  const [newGenreName, setNewGenreName] = useState("")
  const [genreError, setGenreError] = useState<string | null>(null)

  // Brand Management State
  const [pendingBrands, setPendingBrands] = useState<Brand[]>([])
  const [approvedBrands, setApprovedBrands] = useState<Brand[]>([])
  const [deletedBrands, setDeletedBrands] = useState<Brand[]>([])

  const fetchGenres = async () => {
    try {
      const res = await fetch('/api/genres')
      const data = await res.json()
      if (data.success) {
        setGenres(data.genres)
      }
    } catch (error) {
      console.error('Error fetching genres:', error)
    }
  }

  useEffect(() => {
    // Fetch brands
    const fetchBrands = async () => {
      try {
        const res = await fetch('/api/brands')
        const data = await res.json()
        if (data.success) {
          setPendingBrands(data.brands.filter((b: Brand) => !b.isApproved && !b.isDeleted))
          setApprovedBrands(data.brands.filter((b: Brand) => b.isApproved && !b.isDeleted))
          setDeletedBrands(data.brands.filter((b: Brand) => b.isDeleted))
        }
      } catch (error) {
        console.error('Error fetching brands:', error)
      }
    }

    if (isAdmin) {
      fetchGenres()
      fetchBrands()
    }
  }, [isAdmin])

  // Genre Management Functions
  const handleGenreRename = async (genreId: string, newName: string) => {
    try {
      const res = await fetch(`/api/genres/${genreId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      })
      const data = await res.json()
      if (data.success) {
        setGenres(genres.map(g => g.id === genreId ? { ...g, name: newName } : g))
        setSelectedGenre(null)
        setNewGenreName("")
      }
    } catch (error) {
      setGenreError("Failed to rename genre")
    }
  }

  const handleGenreToggleVisibility = async (genreId: string) => {
    try {
      const genre = genres.find(g => g.id === genreId)
      if (!genre) return

      const res = await fetch(`/api/genres/${genreId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isHidden: !genre.isHidden,
          action: 'temporary'
        })
      })
      const data = await res.json()
      if (data.success) {
        setGenres(genres.map(g => g.id === genreId ? { ...g, isHidden: !g.isHidden } : g))
      }
    } catch (error) {
      setGenreError("Failed to update genre visibility")
    }
  }

  const handleGenreBan = async (genreId: string, reason: string) => {
    try {
      const res = await fetch(`/api/genres/${genreId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason,
          action: 'permanent'
        })
      })
      const data = await res.json()
      if (data.success) {
        setGenres(genres.map(g => g.id === genreId ? { ...g, isDeleted: true, bannedReason: reason } : g))
      }
    } catch (error) {
      setGenreError("Failed to ban genre")
    }
  }

  const handleBulkGenreBan = async (genres: string[]) => {
    try {
      const res = await fetch('/api/genres/bulk-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          genres: genres.map(g => g.toLowerCase().trim()),
          reason: "Pre-banned inappropriate content",
          action: 'permanent'
        })
      })
      const data = await res.json()
      if (data.success) {
        // Refresh genres list
        fetchGenres()
      }
    } catch (error) {
      setGenreError("Failed to ban genres")
    }
  }

  const handleImportBannedGenres = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.csv'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        const genres = text.split(/[\n,]/).map(g => g.trim()).filter(Boolean)
        await handleBulkGenreBan(genres)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // Brand Management Functions
  const handleBrandApproval = async (brandId: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/brands/${brandId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: approve })
      })
      const data = await res.json()
      if (data.success) {
        // Update local state
        const brand = pendingBrands.find(b => b.id === brandId)
        if (brand) {
          setPendingBrands(pendingBrands.filter(b => b.id !== brandId))
          if (approve) {
            setApprovedBrands([...approvedBrands, { ...brand, isApproved: true }])
          }
        }
      }
    } catch (error) {
      console.error('Error updating brand approval:', error)
    }
  }

  const handleBrandDelete = async (brandId: string) => {
    if (!confirm('Are you sure you want to delete this brand? The name will be reserved and cannot be reused.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/brands/${brandId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to delete brand')
      }

      // Move brand to deleted list
      const brandToDelete = [...pendingBrands, ...approvedBrands].find(b => b.id === brandId)
      if (brandToDelete) {
        setDeletedBrands(prev => [...prev, { ...brandToDelete, isDeleted: true }])
      }

      // Remove from active lists
      setPendingBrands(prev => prev.filter(b => b.id !== brandId))
      setApprovedBrands(prev => prev.filter(b => b.id !== brandId))

      toast({
        title: "Success",
        description: "Brand has been deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting brand:', error)
      toast({
        title: "Error",
        description: "Failed to delete brand",
        variant: "destructive"
      })
    }
  }

  const handleBrandRestore = async (brandId: string, newUserId?: string) => {
    try {
      const res = await fetch(`/api/admin/brands/${brandId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newUserId })
      })

      if (!res.ok) {
        throw new Error('Failed to restore brand')
      }

      // Move brand back to approved list
      const brandToRestore = deletedBrands.find(b => b.id === brandId)
      if (brandToRestore) {
        setApprovedBrands(prev => [...prev, { ...brandToRestore, isDeleted: false, isApproved: true }])
        setDeletedBrands(prev => prev.filter(b => b.id !== brandId))
      }

      toast({
        title: "Success",
        description: "Brand has been restored successfully"
      })
    } catch (error) {
      console.error('Error restoring brand:', error)
      toast({
        title: "Error",
        description: "Failed to restore brand",
        variant: "destructive"
      })
    }
  }

  // UI Components
  const GenreManagement = () => {
    const isSuperAdmin = auth?.isSuperAdmin?.()

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Genre Management
          </CardTitle>
          <CardDescription>
            Manage, hide, or permanently ban genres. Banned genres cannot be recreated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {genreError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{genreError}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertTitle>Moderation Actions</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Hide:</strong> Temporarily removes genre from explore page and brand displays</li>
                  <li><strong>Ban:</strong> Permanently removes genre and prevents recreation (SuperAdmin only)</li>
                </ul>
              </AlertDescription>
            </Alert>

            {isSuperAdmin && (
              <div className="flex gap-2 pb-4 border-b">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportBannedGenres}
                >
                  Import Banned Words
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = window.prompt("Enter comma-separated genres to ban:")
                    if (text) {
                      const genres = text.split(',').map(g => g.trim()).filter(Boolean)
                      handleBulkGenreBan(genres)
                    }
                  }}
                >
                  Bulk Ban Genres
                </Button>
              </div>
            )}

            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-4">
                {genres.map(genre => (
                  <div key={genre.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{genre.name}</span>
                      {genre.isHidden && (
                        <Badge variant="secondary">Hidden</Badge>
                      )}
                      {genre.isDeleted && (
                        <Badge variant="destructive">Banned</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!genre.isDeleted && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedGenre(genre)
                              setNewGenreName(genre.name)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={genre.isHidden ? "default" : "secondary"}
                            size="sm"
                            onClick={() => handleGenreToggleVisibility(genre.id)}
                          >
                            {genre.isHidden ? "Show" : "Hide"}
                          </Button>
                          {isSuperAdmin && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const reason = window.prompt("Enter reason for banning this genre:")
                                if (reason) handleGenreBan(genre.id, reason)
                              }}
                            >
                              Ban
                            </Button>
                          )}
                        </>
                      )}
                      {genre.isDeleted && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Reason: {genre.bannedReason}</p>
                          {genre.bannedAt && <p>Banned: {new Date(genre.bannedAt).toLocaleDateString()}</p>}
                          {genre.bannedBy && <p>By: {genre.bannedBy}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {selectedGenre && !selectedGenre.isDeleted && (
              <div className="space-y-4 pt-4 border-t">
                <Label>Rename Genre</Label>
                <div className="flex gap-2">
                  <Input
                    value={newGenreName}
                    onChange={(e) => setNewGenreName(e.target.value)}
                    placeholder="New genre name"
                  />
                  <Button
                    onClick={() => handleGenreRename(selectedGenre.id, newGenreName)}
                    disabled={!newGenreName || newGenreName === selectedGenre.name}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedGenre(null)
                      setNewGenreName("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const BrandApproval = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Brand Approvals
        </CardTitle>
        <CardDescription>
          Review and approve new brands
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="space-y-6">
            {pendingBrands.length === 0 ? (
              <p className="text-center text-muted-foreground">No pending brands to review</p>
            ) : (
              pendingBrands.map(brand => (
                <div key={brand.id} className="flex items-start justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium">{brand.name}</h3>
                    <p className="text-sm text-muted-foreground">{brand.description}</p>
                    {brand.genres && brand.genres.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {brand.genres.map(genre => (
                          <Badge key={genre} variant="secondary">{genre}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleBrandApproval(brand.id, true)}
                      className="text-green-500"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBrandApproval(brand.id, false)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    {auth?.isSuperAdmin?.() && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBrandDelete(brand.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  const DeletedBrands = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Deleted Brands
        </CardTitle>
        <CardDescription>
          Manage deleted brands. These brand names are reserved and cannot be reused.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="space-y-6">
            {deletedBrands.length === 0 ? (
              <p className="text-center text-muted-foreground">No deleted brands</p>
            ) : (
              deletedBrands.map(brand => (
                <div key={brand.id} className="flex items-start justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium">{brand.name}</h3>
                    <p className="text-sm text-muted-foreground">{brand.description}</p>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Deleted: {brand.deletedAt ? new Date(brand.deletedAt).toLocaleDateString() : 'Unknown'}</p>
                      <p>Original Owner: {brand.originalUserId || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newUserId = window.prompt("Enter user ID to restore brand to (leave empty for original owner):")
                        handleBrandRestore(brand.id, newUserId || undefined)
                      }}
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  if (!isLoaded || isLoading) {
    return (
      <div className="container py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
        <p>Please sign in to access the platform dashboard.</p>
        <Button asChild className="mt-4">
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You do not have permission to access the platform dashboard.</p>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
        <h1 className="text-3xl font-bold">Platform Dashboard</h1>
          <p className="text-muted-foreground">Manage platform content and moderation</p>
        </div>
      </div>

      <Tabs defaultValue="brands" className="space-y-4">
        <TabsList>
          <TabsTrigger value="brands">Brand Approvals</TabsTrigger>
          <TabsTrigger value="deleted">Deleted Brands</TabsTrigger>
          <TabsTrigger value="genres">Genre Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Content Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="brands" className="space-y-4">
          <BrandApproval />
        </TabsContent>

        <TabsContent value="deleted" className="space-y-4">
          <DeletedBrands />
        </TabsContent>

        <TabsContent value="genres" className="space-y-4">
          <GenreManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Brand Analytics
              </CardTitle>
              <CardDescription>
                View performance metrics and manage social media for all brands
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandAnalytics />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Content Reports
              </CardTitle>
              <CardDescription>
                Review reported content and user complaints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No reports to review at this time.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 