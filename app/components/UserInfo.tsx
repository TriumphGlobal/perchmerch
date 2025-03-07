"use client"

import { useAuth } from "@/contexts/auth-context"

export default function UserInfo() {
  const { user, getVisibleBrands } = useAuth()
  const brands = getVisibleBrands()

  if (!user) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">No user logged in</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Current User Information</h2>
      <div className="space-y-2">
        <p><span className="font-semibold">Username:</span> {user.username}</p>
        <p><span className="font-semibold">Account Type:</span> {user.isAdmin ? "Admin" : "Regular User"}</p>
        
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">My Brands</h3>
          {brands.length === 0 ? (
            <p className="text-gray-600">No brands yet</p>
          ) : (
            <ul className="space-y-2">
              {brands.map(brand => (
                <li key={brand.id} className="p-2 bg-gray-50 rounded">
                  <p className="font-medium">{brand.name}</p>
                  <p className="text-sm text-gray-600">Slug: {brand.slug}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
} 