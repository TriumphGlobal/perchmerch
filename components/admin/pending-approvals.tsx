import { Button } from "@/components/ui/button"

export function PendingApprovals() {
  // This would be fetched from your database in a real application
  const pendingStores = []

  if (pendingStores.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No pending approval requests</div>
  }

  return (
    <div className="space-y-4">
      {pendingStores.map((store: any) => (
        <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="font-medium">{store.name}</div>
            <p className="text-sm text-muted-foreground">By {store.ownerName}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              View
            </Button>
            <Button size="sm" variant="default">
              Approve
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

