"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import UserInfo from "@/app/components/UserInfo"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User, Mail, Phone, MapPin } from "lucide-react"

export default function AccountPage() {
  const { user, deleteBrand } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("personal")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  if (!user) {
    return null
  }

  const handleCreateBrand = () => {
    router.push("/create-brand")
  }

  const handleDeleteBrand = async (brandId: string) => {
    try {
      setIsDeleting(true)
      await deleteBrand(brandId)
      toast({
        title: "Brand deleted",
        description: "Your brand has been successfully deleted."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete brand",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold">Personal Information</h1>
          <p className="text-muted-foreground">
            Manage your personal details and account preferences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" defaultValue="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" defaultValue="Doe" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="john.doe@example.com" defaultValue="john.doe@example.com" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="Tell us a bit about yourself" 
                      className="min-h-[100px]"
                      defaultValue="I'm a brand owner passionate about creating unique merchandise."
                    />
                  </div>
                  
                  <Button type="submit">Save Changes</Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </CardTitle>
                <CardDescription>
                  Update your shipping and billing address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address1">Address Line 1</Label>
                    <Input id="address1" placeholder="123 Main St" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address2">Address Line 2</Label>
                    <Input id="address2" placeholder="Apt 4B" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="New York" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input id="state" placeholder="NY" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">Zip/Postal Code</Label>
                      <Input id="zip" placeholder="10001" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" placeholder="United States" />
                  </div>
                  
                  <Button type="submit">Save Address</Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Communication Preferences
                </CardTitle>
                <CardDescription>
                  Manage your email notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="orderUpdates" className="rounded" defaultChecked />
                    <Label htmlFor="orderUpdates">Order updates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="productNews" className="rounded" defaultChecked />
                    <Label htmlFor="productNews">Product news</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="brandUpdates" className="rounded" defaultChecked />
                    <Label htmlFor="brandUpdates">Brand updates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="promotions" className="rounded" />
                    <Label htmlFor="promotions">Promotions and discounts</Label>
                  </div>
                  
                  <Button className="w-full mt-4">Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Secure your account with 2FA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Two-factor authentication adds an extra layer of security to your account by requiring more than just a password to sign in.
                  </p>
                  
                  <Button variant="outline" className="w-full">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 