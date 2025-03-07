export function RecentActivity() {
  // This would be fetched from your database in a real application
  const activities = []

  if (activities.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No recent activity to display</div>
  }

  return (
    <div className="space-y-4">
      {activities.map((activity: any) => (
        <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="font-medium">{activity.title}</div>
            <p className="text-sm text-muted-foreground">{activity.description}</p>
          </div>
          <div className="text-sm text-muted-foreground">{activity.time}</div>
        </div>
      ))}
    </div>
  )
}

