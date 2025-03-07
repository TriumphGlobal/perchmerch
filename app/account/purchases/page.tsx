import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ShoppingBag, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Download,
  MessageSquare
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define types for our data
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  brandName: string;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: 'processing' | 'shipped' | 'delivered';
  items: OrderItem[];
}

interface StatusDetails {
  icon: React.ReactNode;
  color: string;
  label: string;
}

// No mock orders - in a real app, this would come from an API or database
const mockOrders: Order[] = []

// Helper function to get status icon and color
const getStatusDetails = (status: Order['status']): StatusDetails => {
  switch (status) {
    case "processing":
      return { 
        icon: <Clock className="h-5 w-5" />, 
        color: "text-yellow-500",
        label: "Processing"
      }
    case "shipped":
      return { 
        icon: <Truck className="h-5 w-5" />, 
        color: "text-blue-500",
        label: "Shipped"
      }
    case "delivered":
      return { 
        icon: <CheckCircle className="h-5 w-5" />, 
        color: "text-green-500",
        label: "Delivered"
      }
    default:
      return { 
        icon: <Package className="h-5 w-5" />, 
        color: "text-gray-500",
        label: "Unknown"
      }
  }
}

export default function PurchasesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold">My Purchases</h1>
          <p className="text-muted-foreground">
            View and track your order history
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-6">
            {mockOrders.length > 0 ? (
              mockOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <EmptyState />
            )}
          </TabsContent>
          
          <TabsContent value="processing" className="space-y-6">
            {mockOrders
              .filter(order => order.status === "processing")
              .length > 0 ? (
                mockOrders
                  .filter(order => order.status === "processing")
                  .map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))
              ) : (
                <EmptyState />
              )}
          </TabsContent>
          
          <TabsContent value="shipped" className="space-y-6">
            {mockOrders
              .filter(order => order.status === "shipped")
              .length > 0 ? (
                mockOrders
                  .filter(order => order.status === "shipped")
                  .map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))
              ) : (
                <EmptyState />
              )}
          </TabsContent>
          
          <TabsContent value="delivered" className="space-y-6">
            {mockOrders
              .filter(order => order.status === "delivered")
              .length > 0 ? (
                mockOrders
                  .filter(order => order.status === "delivered")
                  .map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))
              ) : (
                <EmptyState />
              )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No orders yet</h3>
      <p className="text-muted-foreground mt-2 mb-6">
        When you make a purchase, your orders will appear here.
      </p>
      <Link href="/demo">
        <Button>Browse Demo Store</Button>
      </Link>
    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  const statusDetails = getStatusDetails(order.status)
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Order {order.id}
            </CardTitle>
            <CardDescription>
              Placed on {new Date(order.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </div>
          <Badge className={`flex items-center gap-1 ${statusDetails.color}`}>
            {statusDetails.icon}
            {statusDetails.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-md p-4">
            {order.items.map((item: OrderItem) => (
              <div key={item.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                <div className="h-16 w-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  <Image 
                    src={item.image} 
                    alt={item.name} 
                    width={64} 
                    height={64} 
                    className="object-cover h-full w-full"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.brandName}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${item.price.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold">${order.total.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                Receipt
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Support
              </Button>
              <Button size="sm" className="flex items-center gap-1">
                <ExternalLink className="h-4 w-4" />
                Track Order
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 