"use client"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { Download, Upload, FileSpreadsheet, AlertTriangle, X } from "lucide-react"
import * as XLSX from 'xlsx'
import { Progress } from "@/components/ui/progress"
import { useDropzone } from 'react-dropzone'
import { debounce } from 'lodash'

interface BulkProductManagerProps {
  brandId?: string
}

interface ProductData {
  shopifyId: string
  title: string
  description?: string
  price: number
  imageUrl?: string
  variants?: {
    title: string
    price: number
    sku?: string
    inventory?: number
  }[]
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
]

export function BulkProductManager({ brandId }: BulkProductManagerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [totalRows, setTotalRows] = useState(0)
  const [processedRows, setProcessedRows] = useState(0)
  const [validationInProgress, setValidationInProgress] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: "File size exceeds 10MB limit",
        variant: "destructive"
      })
      return
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload only Excel files (.xlsx, .xls)",
        variant: "destructive"
      })
      return
    }

    handleFileUpload(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    multiple: false
  })

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadErrors([])
    setProgress(0)
    setProcessedRows(0)
    setValidationInProgress(true)

    // Cancel any ongoing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const data = await readExcelFile(file)
      setTotalRows(data.length)

      // Validate data in chunks to prevent UI blocking
      const chunkSize = 100
      const chunks = []
      for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(data.slice(i, i + chunkSize))
      }

      const validatedProducts: ProductData[] = []
      const errors: string[] = []

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        await new Promise(resolve => setTimeout(resolve, 0)) // Allow UI updates

        const { products, chunkErrors } = validateProductChunk(chunk, i * chunkSize)
        validatedProducts.push(...products)
        errors.push(...chunkErrors)

        setValidationInProgress(false)
        setProgress((i + 1) / chunks.length * 30) // First 30% for validation
      }

      if (errors.length > 0) {
        setUploadErrors(errors)
        if (errors.length === data.length) {
          throw new Error("No valid products found in file")
        }
      }

      // Process products in batches
      const batchSize = 50
      const batches = Math.ceil(validatedProducts.length / batchSize)
      
      let importedCount = 0
      let importErrors: string[] = []

      for (let i = 0; i < batches; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Upload cancelled")
        }

        const batch = validatedProducts.slice(i * batchSize, (i + 1) * batchSize)
        
        const response = await fetch('/api/admin/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products: batch,
            brandId: brandId
          }),
          signal: abortControllerRef.current.signal
        })

        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to import products')
        }

        importedCount += result.imported
        if (result.errors?.length > 0) {
          importErrors = [...importErrors, ...result.errors]
        }

        setProcessedRows(prev => prev + batch.length)
        setProgress(30 + ((i + 1) / batches * 70)) // Remaining 70% for upload
      }

      toast({
        title: "Success",
        description: `Imported ${importedCount} products successfully${importErrors.length ? ` with ${importErrors.length} errors` : ''}`
      })

      if (importErrors.length > 0) {
        setUploadErrors(prev => [...prev, ...importErrors])
      }
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import products",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      setProgress(0)
      setProcessedRows(0)
      setTotalRows(0)
      setValidationInProgress(false)
      abortControllerRef.current = null
    }
  }

  const validateProductChunk = (chunk: any[], startIndex: number) => {
    const errors: string[] = []
    const products: ProductData[] = []
    const seenShopifyIds = new Set<string>()
    const seenSkus = new Set<string>()

    chunk.forEach((row, index) => {
      const actualIndex = startIndex + index
      try {
        // Required fields validation
        if (!row.shopifyId || !row.title || !row.price) {
          throw new Error(`Row ${actualIndex + 1}: Missing required fields (shopifyId, title, or price)`)
        }

        // Data type and range validation
        if (typeof row.price !== 'number' || row.price <= 0 || row.price > 1000000) {
          throw new Error(`Row ${actualIndex + 1}: Invalid price (must be a positive number less than 1,000,000)`)
        }

        // Duplicate shopifyId check
        if (seenShopifyIds.has(String(row.shopifyId))) {
          throw new Error(`Row ${actualIndex + 1}: Duplicate shopifyId ${row.shopifyId}`)
        }
        seenShopifyIds.add(String(row.shopifyId))

        const product: ProductData = {
          shopifyId: String(row.shopifyId),
          title: String(row.title).trim(),
          description: row.description ? String(row.description).trim() : undefined,
          price: Number(row.price),
          imageUrl: row.imageUrl ? String(row.imageUrl).trim() : undefined
        }

        // Enhanced validation
        if (product.title.length > 255) {
          throw new Error(`Row ${actualIndex + 1}: Title exceeds 255 characters`)
        }

        if (product.description && product.description.length > 5000) {
          throw new Error(`Row ${actualIndex + 1}: Description exceeds 5000 characters`)
        }

        // URL validation with timeout
        if (product.imageUrl) {
          if (!isValidUrl(product.imageUrl)) {
            throw new Error(`Row ${actualIndex + 1}: Invalid image URL`)
          }
        }

        // Variants validation with enhanced error handling
        if (row.variants) {
          try {
            const variants = typeof row.variants === 'string' 
              ? JSON.parse(row.variants) 
              : row.variants

            if (!Array.isArray(variants)) {
              throw new Error(`Row ${actualIndex + 1}: Variants must be an array`)
            }

            if (variants.length > 100) {
              throw new Error(`Row ${actualIndex + 1}: Too many variants (maximum 100)`)
            }

            product.variants = variants.map((v: any, vIndex: number) => {
              if (!v.title || typeof v.price !== 'number' || v.price <= 0) {
                throw new Error(`Row ${actualIndex + 1}, Variant ${vIndex + 1}: Invalid variant data`)
              }

              if (v.sku) {
                if (seenSkus.has(v.sku)) {
                  throw new Error(`Row ${actualIndex + 1}, Variant ${vIndex + 1}: Duplicate SKU ${v.sku}`)
                }
                seenSkus.add(v.sku)
              }

              if (v.inventory && (typeof v.inventory !== 'number' || v.inventory < 0)) {
                throw new Error(`Row ${actualIndex + 1}, Variant ${vIndex + 1}: Invalid inventory value`)
              }

              return {
                title: String(v.title).trim(),
                price: Number(v.price),
                sku: v.sku ? String(v.sku).trim() : undefined,
                inventory: v.inventory ? Number(v.inventory) : undefined
              }
            })
          } catch (e) {
            throw new Error(`Row ${actualIndex + 1}: Invalid variants format - ${e.message}`)
          }
        }

        products.push(product)
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error')
      }
    })

    return { products, chunkErrors: errors }
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const url = new URL('/api/admin/products/export', window.location.origin)
      if (brandId) url.searchParams.set('brandId', brandId)

      const response = await fetch(url.toString())
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to export products')
      }

      // Convert data to Excel format with styling
      const ws = XLSX.utils.json_to_sheet(data.products)
      const wb = XLSX.utils.book_new()

      // Add column widths and styling
      const colWidths = [
        { wch: 15 }, // shopifyId
        { wch: 30 }, // title
        { wch: 50 }, // description
        { wch: 10 }, // price
        { wch: 40 }, // imageUrl
        { wch: 40 }  // variants
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Products')
      
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `products_export_${timestamp}.xlsx`

      XLSX.writeFile(wb, filename)

      toast({
        title: "Success",
        description: `Exported ${data.products.length} products successfully`
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export products",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const clearErrors = () => {
    setUploadErrors([])
  }

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(worksheet)
          resolve(json)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = (error) => reject(error)
      reader.readAsBinaryString(file)
    })
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const downloadTemplate = () => {
    const template = [{
      shopifyId: 'example_id',
      title: 'Example Product',
      description: 'Product description',
      price: 29.99,
      imageUrl: 'https://example.com/image.jpg',
      variants: JSON.stringify([
        { title: 'Small', price: 29.99, sku: 'SMALL-001', inventory: 100 },
        { title: 'Medium', price: 29.99, sku: 'MED-001', inventory: 100 }
      ])
    }]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'product_import_template.xlsx')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Product Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Import Products</Label>
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet className="h-8 w-8 mx-auto mb-2" />
              {isDragActive ? (
                <p>Drop the Excel file here</p>
              ) : (
                <p>Drag and drop an Excel file here, or click to select</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Maximum file size: 10MB
              </p>
            </div>

            {(isUploading || validationInProgress) && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <Progress value={progress} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelUpload}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {validationInProgress ? 'Validating data...' : `Processing ${processedRows} of ${totalRows} products...`}
                </p>
              </div>
            )}

            <div className="flex gap-4 mt-4">
              <Button
                variant="outline"
                onClick={downloadTemplate}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Download Template
              </Button>

              <Button
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Products
              </Button>
            </div>
          </div>

          {uploadErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Import Errors:</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearErrors}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <ul className="list-disc pl-4 max-h-60 overflow-y-auto space-y-1">
                    {uploadErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}