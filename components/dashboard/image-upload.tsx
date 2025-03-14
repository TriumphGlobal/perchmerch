"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Upload, Image as ImageIcon } from "lucide-react"

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleUrlChange = (url: string) => {
    // Basic URL validation
    if (!url || url.match(/^https?:\/\/.+\/.+$/)) {
      onChange(url)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)

      // Create FormData
      const formData = new FormData()
      formData.append('file', file)

      // Upload to your server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      onChange(data.url)

      toast({
        title: "Upload successful",
        description: "Your image has been uploaded",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {value && (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Brand image"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <Input
            type="url"
            placeholder="Enter image URL or upload a file"
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            disabled={disabled || isUploading}
          />
        </div>
        <div className="relative">
          <Input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileUpload}
            disabled={disabled || isUploading}
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>
      {value && !value.match(/^https?:\/\/.+\/.+$/) && (
        <p className="text-sm text-destructive">Please enter a valid image URL</p>
      )}
    </div>
  )
} 