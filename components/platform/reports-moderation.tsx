"use client"

import { useState, useEffect } from "react"
import { usePerchAuth } from "../../hooks/usePerchAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { ScrollArea } from "../ui/scroll-area"
import { toast } from "../ui/use-toast"
import { Check, X, Flag } from "lucide-react"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

interface Report {
  id: string
  type: 'product' | 'brand' | 'user'
  targetId: string
  targetName: string
  reason: string
  description: string
  reporterEmail: string
  status: 'pending' | 'resolved' | 'dismissed'
  createdAt: Date
}

export function ReportsModeration() {
  const { getToken } = usePerchAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [actionNotes, setActionNotes] = useState("")
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

  // Fetch reports
  useEffect(() => {
    async function fetchReports() {
      try {
        const token = await getToken()
        const response = await fetch(`/api/reports?status=pending${filterType !== 'all' ? `&type=${filterType}` : ''}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setReports(data)
        }
      } catch (error) {
        console.error('Error fetching reports:', error)
        toast({
          title: "Error",
          description: "Failed to load reports",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [getToken, filterType])

  // Handle report resolution
  const handleReportResolution = async (reportId: string, isResolved: boolean) => {
    if (!actionNotes) {
      toast({
        title: "Error",
        description: "Please provide action notes",
        variant: "destructive"
      })
      return
    }

    try {
      const token = await getToken()
      const response = await fetch('/api/reports/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportId,
          isResolved,
          actionNotes
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Report ${isResolved ? 'resolved' : 'dismissed'} successfully`,
        })
        // Remove report from list
        setReports(prev => prev.filter(r => r.id !== reportId))
        setActionNotes("")
        setSelectedReportId(null)
      } else {
        throw new Error('Failed to update report')
      }
    } catch (error) {
      console.error('Error updating report:', error)
      toast({
        title: "Error",
        description: `Failed to ${isResolved ? 'resolve' : 'dismiss'} report`,
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reports Moderation</CardTitle>
              <CardDescription>
                Review and handle user reports
              </CardDescription>
            </div>
            <Select
              value={filterType}
              onValueChange={setFilterType}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="brand">Brands</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground">Loading reports...</p>
              ) : reports.length === 0 ? (
                <p className="text-muted-foreground">No pending reports to review</p>
              ) : (
                reports.map(report => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            <Flag className="inline-block mr-2 h-4 w-4" />
                            {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                          </CardTitle>
                          <CardDescription>Target: {report.targetName}</CardDescription>
                        </div>
                        <Badge variant="secondary">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div>
                          <Label>Reason</Label>
                          <p className="text-sm font-medium">{report.reason}</p>
                        </div>
                        <div>
                          <Label>Description</Label>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                        <div>
                          <Label>Reported by</Label>
                          <p className="text-sm text-muted-foreground">{report.reporterEmail}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedReportId === report.id ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="actionNotes">Action Notes</Label>
                            <Textarea
                              id="actionNotes"
                              value={actionNotes}
                              onChange={(e) => setActionNotes(e.target.value)}
                              placeholder="Describe the action taken..."
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedReportId(null)
                                setActionNotes("")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleReportResolution(report.id, false)}
                            >
                              Dismiss Report
                            </Button>
                            <Button
                              onClick={() => handleReportResolution(report.id, true)}
                            >
                              Resolve Report
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedReportId(report.id)}
                          >
                            Take Action
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
} 