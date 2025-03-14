"use client"

import { useState, useEffect } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface BrandApproval {
  id: string
  brandId: string
  brandName: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  notes?: string
}

export function BrandApprovalManager() {
  const [approvals, setApprovals] = useState<BrandApproval[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/admin/brand-approvals')
        
        if (!response.ok) {
          throw new Error('Failed to fetch brand approvals')
        }
        
        const data = await response.json()
        setApprovals(data.approvals || [])
      } catch (error) {
        console.error('Error fetching brand approvals:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchApprovals()
  }, [])

  const handleApprove = async (brandId: string, approvalId: string) => {
    try {
      const response = await fetch(`/api/admin/brands/${brandId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approvalId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to approve brand')
      }
      
      setApprovals(prev => 
        prev.map(approval => 
          approval.id === approvalId 
            ? { ...approval, status: "approved" } 
            : approval
        )
      )
    } catch (error) {
      console.error('Error approving brand:', error)
    }
  }

  const handleReject = async (brandId: string, approvalId: string) => {
    const notes = prompt('Please provide a reason for rejection:')
    
    try {
      const response = await fetch(`/api/admin/brands/${brandId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approvalId, notes })
      })
      
      if (!response.ok) {
        throw new Error('Failed to reject brand')
      }
      
      setApprovals(prev => 
        prev.map(approval => 
          approval.id === approvalId 
            ? { ...approval, status: "rejected", notes } 
            : approval
        )
      )
    } catch (error) {
      console.error('Error rejecting brand:', error)
    }
  }

  const pendingApprovals = approvals.filter(a => a.status === "pending")

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Brand Approval Requests</h2>
      
      {isLoading ? (
        <div className="text-center py-8">Loading approval requests...</div>
      ) : pendingApprovals.length === 0 ? (
        <Alert>
          <AlertTitle>No pending approvals</AlertTitle>
          <AlertDescription>
            There are currently no brands waiting for approval.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand Name</TableHead>
                <TableHead>Requested On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApprovals.map((approval) => (
                <TableRow key={approval.id}>
                  <TableCell className="font-medium">{approval.brandName}</TableCell>
                  <TableCell>{new Date(approval.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => handleApprove(approval.brandId, approval.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleReject(approval.brandId, approval.id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {approvals.filter(a => a.status !== "pending").length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Recent Decisions</h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Decision Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals
                  .filter(a => a.status !== "pending")
                  .map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell className="font-medium">{approval.brandName}</TableCell>
                      <TableCell>
                        {approval.status === "approved" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="mr-1 h-3 w-3" />
                            Rejected
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(approval.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{approval.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
} 