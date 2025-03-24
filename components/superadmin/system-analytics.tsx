"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Activity, Database, Server, Users } from "lucide-react"
import { toast } from "sonner"

interface SystemMetrics {
  activeUsers: number
  totalUsers: number
  databaseSize: string
  cacheHitRate: number
  averageResponseTime: number
  errorRate: number
  cpuUsage: number
  memoryUsage: number
  storageUsage: number
  requestsPerMinute: number
}

interface TimeSeriesData {
  timestamp: string
  value: number
}

interface SystemAnalytics {
  metrics: SystemMetrics
  responseTimeHistory: TimeSeriesData[]
  errorRateHistory: TimeSeriesData[]
  requestsHistory: TimeSeriesData[]
}

export function SystemAnalytics() {
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/system/analytics")
      if (!response.ok) throw new Error("Failed to fetch system analytics")
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      toast.error("Failed to load system analytics")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !analytics) {
    return <div>Loading analytics...</div>
  }

  const { metrics } = analytics

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-500" />
            <h3 className="font-medium">Active Users</h3>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">{metrics.activeUsers}</span>
            <span className="text-sm text-gray-500 ml-2">
              / {metrics.totalUsers} total
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-green-500" />
            <h3 className="font-medium">Response Time</h3>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">
              {metrics.averageResponseTime.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500 ml-2">ms</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-orange-500" />
            <h3 className="font-medium">System Load</h3>
          </div>
          <div className="mt-2">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-sm text-gray-500">CPU</span>
                <div className="text-lg font-semibold">{metrics.cpuUsage}%</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Memory</span>
                <div className="text-lg font-semibold">{metrics.memoryUsage}%</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-purple-500" />
            <h3 className="font-medium">Database</h3>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{metrics.databaseSize}</div>
            <div className="text-sm text-gray-500">
              {metrics.cacheHitRate}% cache hit rate
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Graphs */}
      <Card className="p-6">
        <Tabs defaultValue="response-time">
          <TabsList>
            <TabsTrigger value="response-time">Response Time</TabsTrigger>
            <TabsTrigger value="error-rate">Error Rate</TabsTrigger>
            <TabsTrigger value="requests">Requests/min</TabsTrigger>
          </TabsList>

          <div className="h-[300px] mt-4">
            <TabsContent value="response-time">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.responseTimeHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleString()
                    }
                  />
                  <Bar dataKey="value" fill="#3b82f6" name="Response Time (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="error-rate">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.errorRateHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleString()
                    }
                  />
                  <Bar dataKey="value" fill="#ef4444" name="Error Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="requests">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.requestsHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleString()
                    }
                  />
                  <Bar dataKey="value" fill="#10b981" name="Requests/min" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {/* System Status */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">System Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Error Rate</span>
            <Badge
              variant={metrics.errorRate < 1 ? "default" : "destructive"}
            >
              {metrics.errorRate.toFixed(2)}%
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Storage Usage</span>
            <Badge
              variant={metrics.storageUsage < 80 ? "default" : "destructive"}
            >
              {metrics.storageUsage}%
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Requests per Minute</span>
            <Badge variant="secondary">{metrics.requestsPerMinute}</Badge>
          </div>
        </div>
      </Card>
    </div>
  )
} 