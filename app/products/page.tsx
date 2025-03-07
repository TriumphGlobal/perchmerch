"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const mockProducts = [
  {
    id: "prod_1",
    name: "Classic T-Shirt",
    description: "100% cotton, pre-shrunk classic fit t-shirt",
    price: 24.99,
    image: "https://placehold.co/300x400",
  },
  {
    id: "prod_2",
    name: "Hoodie",
    description: "Premium cotton blend pullover hoodie",
    price: 49.99,
    image: "https://placehold.co/300x400",
  },
  {
    id: "prod_3",
    name: "Coffee Mug",
    description: "11oz ceramic mug, dishwasher and microwave safe",
    price: 14.99,
    image: "https://placehold.co/300x400",
  },
  {
    id: "prod_4",
    name: "Phone Case",
    description: "Durable phone case with full wrap print",
    price: 19.99,
    image: "https://placehold.co/300x400",
  },
]

export default function ProductsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Products"
        text="Browse our catalog of customizable products."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader className="p-0">
              <div className="aspect-square relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="object-cover w-full h-full rounded-t-lg"
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
              <CardDescription className="mb-4">{product.description}</CardDescription>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">${product.price}</span>
                <Button>Add to Store</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  )
} 