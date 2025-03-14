import Link from "next/link"
import Image from "next/image"

interface Brand {
  id: string
  name: string
  logo: string
  genres?: string[]
}

interface BrandCardProps {
  brand: Brand
}

export function BrandCard({ brand }: BrandCardProps) {
  return (
    <Link href={`/brands/${brand.id}`} className="block group">
      <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
        {brand.logo ? (
          <Image
            src={brand.logo}
            alt={brand.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Logo
          </div>
        )}
      </div>
      <div className="mt-2">
        <h3 className="font-medium text-lg">{brand.name}</h3>
        {brand.genres && brand.genres.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {brand.genres.join(", ")}
          </div>
        )}
      </div>
    </Link>
  )
} 