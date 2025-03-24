"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

interface TeamMember {
  id: string
  email: string
  role: "owner" | "manager"
  joinedAt: string
}

interface Brand {
  id: string
  brandId: string
  name: string
}

interface BrandTeamProps {
  brand: Brand
}

export function BrandTeam({ brand }: BrandTeamProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState<"manager">("manager")
  const [addingMember, setAddingMember] = useState(false)

  useEffect(() => {
    fetchTeamMembers()
  }, [brand.brandId])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/brands/${brand.brandId}/team`)
      if (!response.ok) {
        throw new Error("Failed to fetch team members")
      }
      const data = await response.json()
      setMembers(data.members || [])
    } catch (error) {
      console.error("Error fetching team members:", error)
      toast.error("Failed to load team members")
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingMember(true)

    try {
      const response = await fetch(`/api/brands/${brand.brandId}/team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newMemberEmail,
          role: newMemberRole,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add team member")
      }

      await fetchTeamMembers()
      setNewMemberEmail("")
      toast.success("Team member added")
    } catch (error) {
      console.error("Error adding team member:", error)
      toast.error("Failed to add team member")
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) {
      return
    }

    try {
      const response = await fetch(`/api/brands/${brand.brandId}/team/${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove team member")
      }

      await fetchTeamMembers()
      toast.success("Team member removed")
    } catch (error) {
      console.error("Error removing team member:", error)
      toast.error("Failed to remove team member")
    }
  }

  if (loading) {
    return <div>Loading team members...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage who has access to your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Email address"
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                disabled={addingMember}
                required
              />
              <Select
                value={newMemberRole}
                onValueChange={(value) => setNewMemberRole(value as "manager")}
                disabled={addingMember}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={addingMember}>
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>
          </form>

          <div className="mt-6 space-y-4">
            {members.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No team members yet
              </p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{member.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                        {member.role}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {member.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 