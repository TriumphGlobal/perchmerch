"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { BrandFilters } from "@/components/brands/brand-filters"
import { BrandGrid } from "@/components/brands/brand-grid"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface Brand {
  id: string;
  name: string;
  description?: string;
  genres?: string[];
  isApproved?: boolean;
  isHidden?: boolean;
  isDeleted?: boolean;
}

export default function ExplorePage() {
  const { getAllBrands } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all")

  const brands = getAllBrands() as Brand[]
  const genres = Array.from(new Set(brands.flatMap(brand => brand.genres || [])))

  // Filter brands based on search and genre
  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         brand.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGenre = selectedGenre === "all" || brand.genres?.includes(selectedGenre)
    const isVisible = !brand.isHidden && !brand.isDeleted && brand.isApproved
    return matchesSearch && matchesGenre && isVisible
  })

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <BrandFilters
            genres={genres}
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search brands..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Results */}
          {filteredBrands.length > 0 ? (
            <BrandGrid brands={filteredBrands} />
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No brands found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedGenre !== "all"
                  ? "Try adjusting your filters or search query"
                  : "Be the first to create a brand!"}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
} 