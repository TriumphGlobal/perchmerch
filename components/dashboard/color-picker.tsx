import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value: string[]
  onChange: (colors: string[]) => void
  max: number
}

const colorOptions = [
  { name: "Blue", value: "#4285F4" },
  { name: "Red", value: "#DB4437" },
  { name: "Yellow", value: "#F4B400" },
  { name: "Green", value: "#0F9D58" },
  { name: "Purple", value: "#9C27B0" },
  { name: "Orange", value: "#FF5722" },
]

export function ColorPicker({ value, onChange, max }: ColorPickerProps) {
  const [selectedColors, setSelectedColors] = useState<string[]>(value)

  const handleColorToggle = (color: string) => {
    let newColors
    if (selectedColors.includes(color)) {
      newColors = selectedColors.filter((c) => c !== color)
    } else {
      if (selectedColors.length < max) {
        newColors = [...selectedColors, color]
      } else {
        return // Max colors reached
      }
    }
    setSelectedColors(newColors)
    onChange(newColors)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {colorOptions.map((color) => (
        <Button
          key={color.value}
          type="button"
          variant="outline"
          className={cn(
            "w-8 h-8 rounded-full p-0",
            selectedColors.includes(color.value) && "ring-2 ring-offset-2 ring-offset-background",
          )}
          style={{ backgroundColor: color.value }}
          onClick={() => handleColorToggle(color.value)}
        >
          <span className="sr-only">{color.name}</span>
        </Button>
      ))}
    </div>
  )
}

