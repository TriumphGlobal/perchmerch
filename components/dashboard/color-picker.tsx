import { useState } from "react"
import { HexColorPicker } from "react-colorful"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, Plus, X } from "lucide-react"

interface ColorPickerProps {
  value: string[]
  onChange: (colors: string[]) => void
  max?: number
}

const PRESET_COLORS = [
  "#000000", // Black
  "#FFFFFF", // White
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  "#800080", // Purple
  "#008080", // Teal
  "#FF69B4", // Hot Pink
]

export function ColorPicker({ value, onChange, max = 3 }: ColorPickerProps) {
  const [isCustomColorOpen, setIsCustomColorOpen] = useState(false)
  const [customColor, setCustomColor] = useState("#000000")

  const handleColorSelect = (color: string) => {
    if (value.includes(color)) {
      onChange(value.filter((c) => c !== color))
    } else if (value.length < max) {
      onChange([...value, color])
    }
  }

  const handleCustomColorAdd = () => {
    if (value.length < max) {
      handleColorSelect(customColor)
      setIsCustomColorOpen(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {/* Selected Colors Display */}
        {value.map((color) => (
          <div
            key={color}
            className="relative group h-10 w-10 rounded-lg cursor-pointer overflow-hidden"
            style={{
              backgroundColor: color,
              border: color.toLowerCase() === "#ffffff" ? "1px solid #e2e8f0" : "none"
            }}
            onClick={() => handleColorSelect(color)}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <X className="h-4 w-4 text-white" />
            </div>
          </div>
        ))}

        {/* Add Color Button */}
        {value.length < max && (
          <Popover open={isCustomColorOpen} onOpenChange={setIsCustomColorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-10 w-10 p-0"
                onClick={() => setIsCustomColorOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <div className="space-y-3">
                <HexColorPicker color={customColor} onChange={setCustomColor} />
                <div className="flex justify-between">
                  <div
                    className="h-9 w-9 rounded-md border"
                    style={{ backgroundColor: customColor }}
                  />
                  <Button size="sm" onClick={handleCustomColorAdd}>
                    Add Color
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Preset Colors */}
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <div
            key={color}
            className="relative group h-8 w-8 rounded-md cursor-pointer overflow-hidden"
            style={{
              backgroundColor: color,
              border: color.toLowerCase() === "#ffffff" ? "1px solid #e2e8f0" : "none"
            }}
            onClick={() => handleColorSelect(color)}
          >
            {value.includes(color) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20" />
          </div>
        ))}
      </div>
    </div>
  )
}

