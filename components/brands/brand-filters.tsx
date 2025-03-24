"use client"

import { Card } from "../../components/ui/card"
import { Label } from "../../components/ui/label"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"
import { cn } from "../../lib/utils"

interface BrandFiltersProps extends React.HTMLAttributes<HTMLDivElement> {
  genres?: string[]
  selectedGenre?: string
  onGenreChange?: (genre: string) => void
}

export function BrandFilters({
  genres = [],
  selectedGenre,
  onGenreChange,
  className,
  ...props
}: BrandFiltersProps) {
  return (
    <Card className={cn("p-6", className)} {...props}>
      <div>
        <h3 className="font-semibold mb-4">Categories</h3>
        <RadioGroup
          value={selectedGenre || "all"}
          onValueChange={onGenreChange}
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all">All Brands</Label>
            </div>
            {genres.map((genre) => (
              <div key={genre} className="flex items-center space-x-2">
                <RadioGroupItem value={genre} id={genre} />
                <Label htmlFor={genre}>{genre}</Label>
              </div>
            ))}
            {genres.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No genres available yet
              </p>
            )}
          </div>
        </RadioGroup>
      </div>
    </Card>
  )
} 