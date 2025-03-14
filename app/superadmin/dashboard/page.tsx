"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AdminShell } from "@/components/admin/admin-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CalendarDays, DollarSign, ShoppingBag, Users } from "lucide-react"

interface Order {
  id: string
  date: string
  customer: string
  product: string
  amount: number
  commission: number
  affiliate: string | null
}

interface Product {
  id: string
  name: string
  price: number
  sales: number
  image: string
}

const demoOrders: Order[] = [
  {
    id: "ORD001",
    date: "2024-03-20",
    customer: "John Doe",
    product: "Classic T-Shirt",
    amount: 29.99,
    commission: 7.50,
    affiliate: "sarah_styles"
  },
  {
    id: "ORD002",
    date: "2024-03-19",
    customer: "Jane Smith",
    product: "Hoodie",
    amount: 49.99,
    commission: 12.50,
    affiliate: null
  }
]

const demoProducts: Product[] = [
  {
    id: "1",
    name: "Classic T-Shirt",
    price: 29.99,
    sales: 125,
    image: "https://placehold.co/200x200.jpg"
  },
  {
    id: "2",
    name: "Hoodie",
    price: 49.99,
    sales: 75,
    image: "https://placehold.co/200x200.jpg"
  }
]

export default function AdminDashboard() {
  const { user, canManageBrand } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  // Redirect if not admin or can't manage admin brand
  if (!user?.isAdmin || !canManageBrand("admin")) {
    router.push("/")
    return null
  }

  const totalSales = demoOrders.reduce((sum, order) => sum + order.amount, 0)
  const totalCommissions = demoOrders.reduce((sum, order) => sum + order.commission, 0)
  const netEarnings = totalSales - totalCommissions

  return (
    <AdminShell>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Brand Dashboard</h1>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push("/admin")}
              variant="secondary"
            >
              View Store
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">${totalSales.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Earnings</p>
                <p className="text-2xl font-bold">${netEarnings.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Affiliates</p>
                <p className="text-2xl font-bold">{demoOrders.filter(o => o.affiliate).length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Products</p>
                <p className="text-2xl font-bold">{demoProducts.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-2 px-1 ${
                activeTab === "overview"
                  ? "border-b-2 border-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`pb-2 px-1 ${
                activeTab === "products"
                  ? "border-b-2 border-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`pb-2 px-1 ${
                activeTab === "orders"
                  ? "border-b-2 border-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-2 px-1 ${
                activeTab === "settings"
                  ? "border-b-2 border-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-2">Order ID</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Product</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Affiliate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoOrders.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="py-2">{order.id}</td>
                        <td className="py-2">{order.date}</td>
                        <td className="py-2">{order.product}</td>
                        <td className="py-2">${order.amount.toFixed(2)}</td>
                        <td className="py-2">{order.affiliate || "Direct"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "products" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {demoProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-muted-foreground">${product.price.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Total Sales: {product.sales}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "orders" && (
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-2">Order ID</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Commission</th>
                    <th className="pb-2">Affiliate</th>
                  </tr>
                </thead>
                <tbody>
                  {demoOrders.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="py-2">{order.id}</td>
                      <td className="py-2">{order.date}</td>
                      <td className="py-2">{order.customer}</td>
                      <td className="py-2">{order.product}</td>
                      <td className="py-2">${order.amount.toFixed(2)}</td>
                      <td className="py-2">${order.commission.toFixed(2)}</td>
                      <td className="py-2">{order.affiliate || "Direct"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Brand Settings</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Brand Name</label>
                <input
                  type="text"
                  value="Admin Brand"
                  className="w-full p-2 border rounded-md"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brand Image URL</label>
                <input
                  type="text"
                  value="https://placehold.co/200x200.jpg"
                  className="w-full p-2 border rounded-md"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Affiliate Commission Rate (% of your profit)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={25}
                    className="w-24 p-2 border rounded-md"
                    disabled
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  This is the percentage of your profit that affiliates will earn from each sale.
                </p>
              </div>
              <Button disabled>
                Save Changes
              </Button>
              <p className="text-sm text-muted-foreground">
                Note: Settings are currently view-only. Editing will be enabled once Printify and Shopify integration is complete.
              </p>
            </Card>
          </div>
        )}
      </div>
    </AdminShell>
  )
}

