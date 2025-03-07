"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
}

const demoProducts: Product[] = [
  {
    id: "1",
    name: "Classic T-Shirt",
    description: "Premium cotton t-shirt with custom design",
    price: 29.99,
    image: "https://placehold.co/300x400.jpg"
  },
  {
    id: "2",
    name: "Hoodie",
    description: "Comfortable pullover hoodie with custom design",
    price: 49.99,
    image: "https://placehold.co/300x400.jpg"
  }
]

export default function AdminStorePage() {
  const { user, canManageBrand } = useAuth()
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Brand Store</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to our demo brand store
          </p>
        </div>
        {user?.isAdmin && canManageBrand("admin") && (
          <Button
            onClick={() => router.push("/admin/dashboard")}
            variant="outline"
          >
            Manage Store
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoProducts.map((product) => (
          <div key={product.id} className="bg-card rounded-lg shadow-sm overflow-hidden">
            <div className="relative h-[400px]">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-muted-foreground mt-1">{product.description}</p>
              <div className="flex justify-between items-center mt-4">
                <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
                <Button>Add to Cart</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 