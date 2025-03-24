import { auth } from "@clerk/nextjs/server"
import { currentUser } from "@clerk/nextjs/server"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import BrandCreateForm from "@/components/brand/brand-create-form"

export default async function CreateBrandPage() {
  const [clerkUser, localUser] = await Promise.all([
    currentUser(),
    getCurrentUser()
  ])
  if (!clerkUser?.id && !localUser?.id || localUser==null) {
    redirect("/sign-in")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Create a New Brand</h1>
      <p className="text-gray-600 mb-8">
        Fill out the details below to create your brand. Your brand will be reviewed by our team before it becomes visible on the platform.
      </p>
      <BrandCreateForm user={localUser}/>
    </div>
  )
} 