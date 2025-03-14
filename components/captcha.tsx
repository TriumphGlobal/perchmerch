"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../components/ui/button"
import { RefreshCw } from "lucide-react"

interface CaptchaProps {
  onVerify: (token: string) => void
}

// Simple captcha implementation
// In a production app, you would use a service like reCAPTCHA
export function Captcha({ onVerify }: CaptchaProps) {
  const [captchaText, setCaptchaText] = useState("")
  const [userInput, setUserInput] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Generate a random captcha text
  const generateCaptchaText = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
  
  // Draw the captcha on the canvas
  const drawCaptcha = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Fill background
    ctx.fillStyle = "#f5f5f5"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw text
    ctx.font = "bold 24px Arial"
    ctx.fillStyle = "#333"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    
    // Add some noise and distortion
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.strokeStyle = `rgba(0, 0, 0, 0.2)`
      ctx.stroke()
    }
    
    // Draw each character with slight rotation
    const chars = captchaText.split("")
    const charWidth = canvas.width / (chars.length + 1)
    
    chars.forEach((char, i) => {
      ctx.save()
      ctx.translate(charWidth * (i + 1), canvas.height / 2)
      ctx.rotate((Math.random() - 0.5) * 0.3)
      ctx.fillText(char, 0, 0)
      ctx.restore()
    })
    
    // Add some dots
    for (let i = 0; i < 50; i++) {
      ctx.beginPath()
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1,
        0,
        Math.PI * 2
      )
      ctx.fillStyle = `rgba(0, 0, 0, 0.2)`
      ctx.fill()
    }
  }
  
  // Generate a new captcha
  const refreshCaptcha = () => {
    setUserInput("")
    setError(null)
    setIsVerified(false)
    setCaptchaText(generateCaptchaText())
  }
  
  // Verify the captcha
  const verifyCaptcha = () => {
    if (userInput.toLowerCase() === captchaText.toLowerCase()) {
      setIsVerified(true)
      setError(null)
      // Generate a mock token
      const token = `captcha_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
      onVerify(token)
    } else {
      setError("Incorrect captcha. Please try again.")
      refreshCaptcha()
    }
  }
  
  // Initialize captcha on mount
  useEffect(() => {
    refreshCaptcha()
  }, [])
  
  // Redraw captcha when text changes
  useEffect(() => {
    if (captchaText) {
      drawCaptcha()
    }
  }, [captchaText])
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <canvas
          ref={canvasRef}
          width={200}
          height={60}
          className="border rounded-md"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={refreshCaptcha}
          className="h-10 w-10"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {!isVerified ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter the text above"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button type="button" onClick={verifyCaptcha}>
            Verify
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-green-600 font-medium">
          ✓ Captcha verified
        </div>
      )}
      
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
    </div>
  )
} 