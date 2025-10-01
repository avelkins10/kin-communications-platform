"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Search, Edit, Trash2, User, Users, Shield, Eye } from "lucide-react"
import { toast } from "sonner"
import { useUsers } from "@/lib/hooks/use-admin"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "supervisor" | "agent" | "viewer"
  department?: string
  skills: string[]
  phoneNumber?: string
  quickbaseUserId?: string
  isActive: boolean
  createdAt: string
  taskRouterWorker?: {
    sid: string
    friendlyName: string
    activitySid: string
  }
  _count: {
    assignedTasks: number
    completedTasks: number
  }
}

interface UserFormData {
  name: string
  email: string
  role: "admin" | "supervisor" | "agent" | "viewer"
  department: string
  skills: string[]
  phoneNumber: string
  quickbaseUserId: string
  isActive: boolean
}

const defaultFormData: UserFormData = {
  name: "",
  email: "",
  role: "agent",
  department: "",
  skills: [],
  phoneNumber: "",
  quickbaseUserId: "",
  isActive: true,
}

const availableSkills = [
  "Customer Service",
  "Technical Support",
  "Sales",
  "Billing",
  "Escalation",
  "Spanish",
  "French",
  "Emergency Response",
]

const departments = [
  "Customer Service",
  "Technical Support",
  "Sales",
  "Billing",
  "Management",
]

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>(defaultFormData)
  const [submitting, setSubmitting] = useState(false)

  // Use the shared hook for user management
  const { 
    data: users, 
    loading, 
    error, 
    refetch, 
    createItem, 
    updateItem, 
    deleteItem 
  } = useUsers()

  // Refetch when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.append("search", searchTerm)
    if (roleFilter !== "all") params.append("role", roleFilter)
    if (departmentFilter !== "all") params.append("department", departmentFilter)
    
    // Update the endpoint with filters and refetch
    refetch()
  }, [searchTerm, roleFilter, departmentFilter, refetch])


  const handleCreateUser = async () => {
    try {
      setSubmitting(true)
      await createItem(formData)
      setIsCreateDialogOpen(false)
      setFormData(defaultFormData)
    } catch (error) {
      console.error("Error creating user:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      setSubmitting(true)
      await updateItem(editingUser.id, formData)
      setIsEditDialogOpen(false)
      setEditingUser(null)
      setFormData(defaultFormData)
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return

    try {
      await deleteItem(userId)
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || "",
      skills: user.skills,
      phoneNumber: user.phoneNumber || "",
      quickbaseUserId: user.quickbaseUserId || "",
      isActive: user.isActive,
    })
    setIsEditDialogOpen(true)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />
      case "supervisor":
        return <Users className="h-4 w-4" />
      case "agent":
        return <User className="h-4 w-4" />
      case "viewer":
        return <Eye className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "supervisor":
        return "bg-blue-100 text-blue-800"
      case "agent":
        return "bg-green-100 text-green-800"
      case "viewer":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <UserForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreateUser}
                submitting={submitting}
                onSkillToggle={handleSkillToggle}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={refetch} variant="outline" className="w-full">
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
            <CardDescription>
              Manage user accounts and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>TaskRouter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {user.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.skills.slice(0, 2).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {user.skills.length > 2 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary" className="text-xs">
                                  +{user.skills.length - 2}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  {user.skills.slice(2).map((skill) => (
                                    <div key={skill}>{skill}</div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.taskRouterWorker ? (
                          <Badge variant="outline" className="text-green-600">
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            Not Connected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <UserForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdateUser}
              submitting={submitting}
              onSkillToggle={handleSkillToggle}
            />
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

interface UserFormProps {
  formData: UserFormData
  setFormData: (data: UserFormData) => void
  onSubmit: () => void
  submitting: boolean
  onSkillToggle: (skill: string) => void
}

function UserForm({ formData, setFormData, onSubmit, submitting, onSkillToggle }: UserFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            placeholder="Enter phone number"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quickbaseUserId">QuickBase User ID</Label>
          <Input
            id="quickbaseUserId"
            value={formData.quickbaseUserId}
            onChange={(e) => setFormData({ ...formData, quickbaseUserId: e.target.value })}
            placeholder="Enter QuickBase User ID"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Skills</Label>
        <div className="grid grid-cols-2 gap-2">
          {availableSkills.map((skill) => (
            <div key={skill} className="flex items-center space-x-2">
              <Checkbox
                id={skill}
                checked={formData.skills.includes(skill)}
                onCheckedChange={() => onSkillToggle(skill)}
              />
              <Label htmlFor={skill} className="text-sm font-normal">
                {skill}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => setFormData(defaultFormData)}>
          Reset
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Save User"}
        </Button>
      </div>
    </div>
  )
}
