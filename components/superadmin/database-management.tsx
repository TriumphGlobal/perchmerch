"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Database, Download, Upload, RefreshCw, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface BackupInfo {
  id: string
  createdAt: string
  size: string
  status: "completed" | "failed" | "in_progress"
}

interface DatabaseStats {
  size: string
  tables: number
  records: number
  lastBackup: string
  backupSize: string
  indexSize: string
  cacheSize: string
}

export function DatabaseManagement() {
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [backupInProgress, setBackupInProgress] = useState(false)

  useEffect(() => {
    fetchDatabaseInfo()
  }, [])

  const fetchDatabaseInfo = async () => {
    try {
      const [backupsResponse, statsResponse] = await Promise.all([
        fetch("/api/database/backups"),
        fetch("/api/database/stats"),
      ])

      if (!backupsResponse.ok || !statsResponse.ok) {
        throw new Error("Failed to fetch database information")
      }

      const backupsData = await backupsResponse.json()
      const statsData = await statsResponse.json()

      setBackups(backupsData)
      setStats(statsData)
    } catch (error) {
      toast.error("Failed to load database information")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    try {
      setBackupInProgress(true)
      const response = await fetch("/api/database/backup", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to create backup")
      
      toast.success("Backup started successfully")
      fetchDatabaseInfo() // Refresh the list
    } catch (error) {
      toast.error("Failed to create backup")
      console.error(error)
    } finally {
      setBackupInProgress(false)
    }
  }

  const restoreBackup = async (backupId: string) => {
    if (!confirm("Are you sure you want to restore this backup? This will overwrite current data.")) {
      return
    }

    try {
      const response = await fetch(`/api/database/restore/${backupId}`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to restore backup")
      
      toast.success("Database restore initiated")
      fetchDatabaseInfo()
    } catch (error) {
      toast.error("Failed to restore backup")
      console.error(error)
    }
  }

  const deleteBackup = async (backupId: string) => {
    if (!confirm("Are you sure you want to delete this backup?")) {
      return
    }

    try {
      const response = await fetch(`/api/database/backup/${backupId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete backup")
      
      toast.success("Backup deleted successfully")
      fetchDatabaseInfo()
    } catch (error) {
      toast.error("Failed to delete backup")
      console.error(error)
    }
  }

  if (loading) {
    return <div>Loading database information...</div>
  }

  return (
    <div className="space-y-6">
      {/* Database Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Database Overview</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDatabaseInfo}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-gray-500">Database Size</span>
              <div className="text-2xl font-bold">{stats.size}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Total Tables</span>
              <div className="text-2xl font-bold">{stats.tables}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Total Records</span>
              <div className="text-2xl font-bold">{stats.records}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Last Backup</span>
              <div className="text-2xl font-bold">
                {new Date(stats.lastBackup).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Index Size</span>
              <span className="text-sm font-medium">{stats?.indexSize}</span>
            </div>
            <Progress value={70} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Cache Size</span>
              <span className="text-sm font-medium">{stats?.cacheSize}</span>
            </div>
            <Progress value={45} />
          </div>
        </div>
      </Card>

      {/* Backup Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium">Database Backups</h3>
          <Button
            onClick={createBackup}
            disabled={backupInProgress}
          >
            <Database className="w-4 h-4 mr-2" />
            Create Backup
          </Button>
        </div>

        <div className="space-y-4">
          {backups.map((backup) => (
            <div
              key={backup.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {new Date(backup.createdAt).toLocaleString()}
                  </span>
                  <Badge
                    variant={
                      backup.status === "completed"
                        ? "default"
                        : backup.status === "failed"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {backup.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">Size: {backup.size}</div>
              </div>

              <div className="flex items-center space-x-2">
                {backup.status === "completed" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreBackup(backup.id)}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Restore
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteBackup(backup.id)}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {backups.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No backups available
            </div>
          )}
        </div>
      </Card>
    </div>
  )
} 