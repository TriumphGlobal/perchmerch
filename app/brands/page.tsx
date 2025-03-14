"use client"

import { BrandGrid } from "@/components/brands/brand-grid"
import { BrandFilters } from "@/components/brands/brand-filters"
import { useAuth } from "@/contexts/auth-context"

export default function ExploreBrandsPage() {
  const { brands } = useAuth()

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Explore Brands</h1>
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <aside>
          <BrandFilters />
        </aside>
        <main>
          <BrandGrid brands={brands} />
        </main>
      </div>
    </div>
  )
} 