"use client"

import { useState, useRef } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Card } from "../components/ui/card"
import { toast } from "../components/ui/use-toast"
import { Link as LinkIcon, Upload, ImageIcon, X, AlertCircle } from "lucide-react"
import Image from "next/image"

export interface ImageUploadProps {
  onChange: (value: string) => void
  value?: string
  placeholder?: string
  maxSizeMB?: number
}

export function ImageUpload({
  onChange,
  value = "",
  placeholder = "Upload an image",
  maxSizeMB = 5
}: ImageUploadProps) {
  const [inputType, setInputType] = useState<"upload" | "url">("upload")
  const [imageUrl, setImageUrl] = useState<string>(value)
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Convert MB to bytes
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  
  const validateFile = (file: File): boolean => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setError("File must be an image (JPEG, PNG, WebP, or GIF)")
      return false
    }
    
    // Check file size
    if (file.size > maxSizeBytes) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB`)
      return false
    }
    
    setError(null)
    return true
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault() // Prevent form submission
    const file = e.target.files?.[0]
    if (!file) return
    
    if (validateFile(file)) {
      // Create a URL for the file
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
      setImageUrl("")
      onChange(objectUrl)
    }
    
    // Reset the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault() // Prevent form submission
    const url = e.target.value
    setImageUrl(url)
    
    // Basic URL validation
    const isValidUrl = url.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i)
    
    if (url && !isValidUrl) {
      setError("Please enter a valid image URL (http or https)")
      setPreviewUrl(null)
    } else {
      setError(null)
      setPreviewUrl(url || null)
      onChange(url)
    }
  }
  
  const handleClearImage = () => {
    setPreviewUrl(null)
    setImageUrl("")
    onChange("")
    setError(null)
  }
  
  return (
    <div className="space-y-4">
      <Tabs value={inputType} onValueChange={(v) => setInputType(v as "upload" | "url")}>
        <TabsList className="mb-2">
          <TabsTrigger value="upload" className="flex items-center gap-1">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-1">
            <LinkIcon className="h-4 w-4" />
            URL
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <div className="space-y-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/gif"
              onChange={handleFileChange}
              className="cursor-pointer"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault() // Prevent form submission on Enter key
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Accepted formats: JPEG, PNG, WebP, GIF. Max size: {maxSizeMB}MB
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="url">
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={handleUrlChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault() // Prevent form submission on Enter key
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Enter a direct link to an image (must end with .jpg, .png, .webp, or .gif)
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {previewUrl ? (
        <div className="relative">
          <Card className="p-1 overflow-hidden">
            <div className="relative aspect-square w-full max-w-[300px] mx-auto overflow-hidden rounded-md">
              <Image
                src={previewUrl}
                alt="Image preview"
                fill
                className="object-contain"
                onError={() => {
                  setError("Failed to load image. Please check the URL and try again.")
                  setPreviewUrl(null)
                }}
              />
            </div>
          </Card>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80"
            onClick={handleClearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border rounded-md p-4 flex flex-col items-center justify-center gap-2 aspect-square w-full max-w-[300px] mx-auto text-muted-foreground">
          <ImageIcon className="h-10 w-10 opacity-30" />
          <p className="text-sm">{placeholder}</p>
        </div>
      )}
    </div>
  )
} 