import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface StoreStatusProps {
  name: string
  status: "pending" | "approved" | "rejected" | "none"
  message?: string
}

export function StoreStatus({ name, status, message }: StoreStatusProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
          {status === "pending" && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Pending Approval
            </Badge>
          )}
          {status === "approved" && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Approved
            </Badge>
          )}
          {status === "rejected" && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Rejected
            </Badge>
          )}
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
      {status === "none" ? (
        <Link href="/dashboard/create-store">
          <Button size="sm">Create Store</Button>
        </Link>
      ) : (
        <Link href={status === "approved" ? `/dashboard/stores/${name}` : "#"}>
          <Button size="sm" variant="outline" disabled={status !== "approved"}>
            {status === "approved" ? "Manage" : "View"}
          </Button>
        </Link>
      )}
    </div>
  )
}

