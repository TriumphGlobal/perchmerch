"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePerchAuth } from "@/hooks/usePerchAuth"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Eye, 
  Settings, 
  LogOut, 
  ChevronDown,
  Store,
  ShoppingBag,
  Users,
  BarChart
} from "lucide-react"

interface HeaderProps {
  brandId: string
}

interface Brand {
  id: string
  name: string
  brandId: string
  imageUrl: string | null
}

export function Header({ brandId }: HeaderProps) {
  const router = useRouter()
  const { localUser } = usePerchAuth()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [otherBrands, setOtherBrands] = useState<Brand[]>([])

  useEffect(() => {
    const fetchBrandData = async () => {
      if (!localUser?.email) return

      try {
        const [brandResponse, brandsResponse] = await Promise.all([
          fetch(`/api/brands/${brandId}`),
          fetch(`/api/brands?userEmail=${encodeURIComponent(localUser.email)}`)
        ])

        if (!brandResponse.ok || !brandsResponse.ok) {
          throw new Error("Failed to fetch brand data")
        }

        const [brandData, brandsData] = await Promise.all([
          brandResponse.json(),
          brandsResponse.json()
        ])

        setBrand(brandData)
        setOtherBrands(brandsData.filter((b: Brand) => b.id !== brandId))
      } catch (error) {
        console.error("Error fetching brand data:", error)
      }
    }

    fetchBrandData()
  }, [brandId, localUser?.email])

  if (!brand || !localUser) {
    return null
  }

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 gap-4">
        <Link href="/brands" className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          <span className="font-semibold">My Brands</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              {brand.name}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Switch Brand</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {otherBrands.map((otherBrand) => (
              <DropdownMenuItem
                key={otherBrand.id}
                onClick={() => router.push(`/brands/manage/${otherBrand.brandId}`)}
              >
                {otherBrand.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/brands/create">Create New Brand</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <Link href={`/${brand.brandId}`}>
              <Eye className="h-5 w-5" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <Link href={`/brands/manage/${brand.brandId}/settings`}>
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      <nav className="border-t">
        <div className="flex h-12 items-center px-4 gap-6">
          <Link 
            href={`/brands/manage/${brand.brandId}`}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <BarChart className="h-4 w-4" />
            Overview
          </Link>

          <Link 
            href={`/brands/manage/${brand.brandId}/products`}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Products
          </Link>

          <Link 
            href={`/brands/manage/${brand.brandId}/affiliates`}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <Users className="h-4 w-4" />
            Affiliates
          </Link>
        </div>
      </nav>
    </header>
  )
} 