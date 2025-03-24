import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"

export default async function BrandPreviewPage({
  params
}: {
  params: { brandId: string }
}) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  // Get user and brand data
  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      ownedBrands: {
        where: { id: params.brandId },
        select: { id: true }
      },
      managedBrands: {
        where: { id: params.brandId },
        select: { id: true }
      }
    }
  })

  if (!dbUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: User account not found.</p>
        </div>
      </div>
    )
  }

  // Check if user has access to this brand
  const hasAccess = dbUser.role === "superAdmin" || 
                   dbUser.role === "platformAdmin" ||
                   dbUser.ownedBrands.length > 0 || 
                   dbUser.managedBrands.length > 0

  if (!hasAccess) {
    redirect("/")
  }

  // Get brand data
  const brand = await db.brand.findUnique({
    where: { id: params.brandId },
    include: {
      products: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" }
      },
      socialMedia: true,
      genres: true
    }
  })

  if (!brand) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: Brand not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <p className="text-yellow-600 font-semibold">Preview Mode</p>
        <p className="text-yellow-600">
          This is a preview of how your brand page will look when it's published.
          {!brand.isApproved && " Your brand is currently pending approval."}
          {brand.isHidden && " Your brand is currently hidden from public view."}
        </p>
      </div>

      {/* Brand Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{brand.name}</h1>
        {brand.tagline && (
          <p className="text-xl text-gray-600 mb-4">{brand.tagline}</p>
        )}
        {brand.description && (
          <p className="text-gray-600">{brand.description}</p>
        )}
      </div>

      {/* Brand Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Total Sales</h3>
          <p className="text-2xl">${brand.totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Total Products</h3>
          <p className="text-2xl">{brand.products.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Commission Rate</h3>
          <p className="text-2xl">{(brand.commissionRate * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Products Grid */}
      <h2 className="text-2xl font-bold mb-4">Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {brand.products.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded-lg shadow">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="font-semibold mb-2">{product.name}</h3>
            <p className="text-gray-600 mb-2">{product.description}</p>
            <p className="text-xl font-bold">${product.price.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  )
} 