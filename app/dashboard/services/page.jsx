"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FroalaTextEditor } from "@/components/rich-text-editor"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Loader2, AlertCircle, CheckCircle, Eye, Edit, Trash2, MoreVertical } from "lucide-react"
import { useAuth } from "../../../contexts/auth-context"

const API_BASE_URL = "http://ai.l4it.net:8000"

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [formData, setFormData] = useState({ name: "", content: "", image: null })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  const { token, user, logout } = useAuth()
  const router = useRouter()

  // Function to get proper image URL
  const getImageUrl = (image) => {
    if (!image) return "/placeholder.svg?height=800&width=1600"
    if (image.startsWith("http")) return image

    // Handle static uploads path
    if (image.startsWith("/static/")) {
      return `http://ai.l4it.net:8000${image}`
    }

    // If it's just a filename or relative path, assume it's in static/uploads
    const cleanPath = image.startsWith("/") ? image : `/static/uploads/${image}`
    return `http://ai.l4it.net:8000${cleanPath}`
  }

  // Fetch all services
  const fetchServices = async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/msp-services`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired. Please login again.")
          logout()
          setTimeout(() => {
            router.push("/")
          }, 2000)
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setServices(data.reverse())
      setError(null)
    } catch (err) {
      setError(`Failed to fetch services: ${err.message}`)
      console.error("Error fetching services:", err)
    } finally {
      setLoading(false)
    }
  }

  // Create new service
  const createService = async (name, content, image) => {
    if (!token) return

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append("name", name)
      formData.append("content", content)
      if (image) {
        formData.append("image", image)
      }

      const response = await fetch(`${API_BASE_URL}/msp-services/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired. Please login again.")
          logout()
          setTimeout(() => {
            router.push("/")
          }, 2000)
          return
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const newService = await response.json()
      setServices((prev) => [...prev, newService])
      setSuccess("Service created successfully!")
      setIsCreateDialogOpen(false)
      setFormData({ name: "", content: "", image: null })
    } catch (err) {
      setError(`Failed to create service: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Update service
  const updateService = async (serviceId, name, content, image) => {
    if (!token) return

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append("name", name)
      formData.append("content", content)
      if (image) {
        formData.append("image", image)
      }

      const response = await fetch(`${API_BASE_URL}/msp-services/${serviceId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired. Please login again.")
          logout()
          setTimeout(() => {
            router.push("/")
          }, 2000)
          return
        }
        if (response.status === 403) {
          setError("You don't have permission to edit this service.")
          return
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const updatedService = await response.json()
      setServices((prev) => prev.map((service) => (service.id === serviceId ? updatedService : service)))
      setSuccess("Service updated successfully!")
      setIsEditDialogOpen(false)
      setEditingService(null)
      setFormData({ name: "", content: "", image: null })
    } catch (err) {
      setError(`Failed to update service: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete service
  const deleteService = async (serviceId) => {
    if (!token) return

    if (!confirm("Are you sure you want to delete this service? This action cannot be undone.")) return

    try {
      const response = await fetch(`${API_BASE_URL}/msp-services/${serviceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired. Please login again.")
          logout()
          setTimeout(() => {
            router.push("/")
          }, 2000)
          return
        }
        if (response.status === 403) {
          setError("You don't have permission to delete this service.")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setServices((prev) => prev.filter((service) => service.id !== serviceId))
      setSuccess("Service deleted successfully!")
    } catch (err) {
      setError(`Failed to delete service: ${err.message}`)
    }
  }

  // Handle create form submission
  const handleCreateSubmit = (e) => {
    e.preventDefault()
    const { name, content, image } = formData

    if (!name.trim()) {
      setError("Service name is required")
      return
    }

    if (!content.trim()) {
      setError("Content is required")
      return
    }

    createService(name, content, image)
  }

  // Handle edit form submission
  const handleEditSubmit = (e) => {
    e.preventDefault()
    const { name, content, image } = formData

    if (!name.trim()) {
      setError("Service name is required")
      return
    }

    if (!content.trim()) {
      setError("Content is required")
      return
    }

    if (!editingService) return

    updateService(editingService.id, name, content, image)
  }

  // Handle file input change
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setFormData((prev) => ({ ...prev, image: file }))
  }

  // Reset form and close dialogs
  const resetForm = () => {
    setFormData({ name: "", content: "", image: null })
    setError(null)
    setSuccess(null)
  }

  // Open edit dialog
  const openEditDialog = (service) => {
    if (service.user_id !== user?.id) {
      setError("You don't have permission to edit this service.")
      return
    }
    setEditingService(service)
    setFormData({ name: service.name || "", content: service.content || "", image: null })
    setIsEditDialogOpen(true)
  }

  // Handle delete click
  const handleDeleteClick = (service) => {
    if (service.user_id !== user?.id) {
      setError("You don't have permission to delete this service.")
      return
    }
    deleteService(service.id)
  }

  // Navigate to service detail
  const viewServiceDetail = (serviceId) => {
    router.push(`/dashboard/services/${serviceId}`)
  }

  // Check if user owns the service
  const isOwner = (service) => service.user_id === user?.id

  useEffect(() => {
    if (token) {
      fetchServices()
    }
  }, [token])

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading services...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage your service offerings and content.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
              <DialogDescription>
                Add a new service to your offerings. Fill in the name, content and optionally upload an image.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter service name..."
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <FroalaTextEditor
                    value={formData.content}
                    onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
                    placeholder="Write your service content here..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image (optional)</Label>
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Service"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Services Grid */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No services found</h3>
              <p className="text-muted-foreground">Get started by creating your first service.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{service.name || `Service #${service.id}`}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">Active</Badge>
                    {isOwner(service) && <Badge variant="secondary">Owner</Badge>}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewServiceDetail(service.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {isOwner(service) && (
                          <>
                            <DropdownMenuItem onClick={() => openEditDialog(service)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(service)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {service.image_path && (
                    <div className="aspect-video relative overflow-hidden rounded-md bg-muted">
                      <img
                        src={getImageUrl(service.image_path) || "/placeholder.svg"}
                        alt="Service image"
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.target.style.display = "none"
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          service.content?.substring(0, 150) + (service.content?.length > 150 ? "..." : "") ||
                          "No content available",
                      }}
                      className="text-sm text-muted-foreground line-clamp-3"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => viewServiceDetail(service.id)}>
                      <Eye className="mr-2 h-3 w-3" />
                      View Details
                    </Button>
                    {isOwner(service) && (
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(service)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(service)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update the service name, content and image.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-3">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Service Name *</Label>
                <Input
                  id="edit-name"
                  type="text"
                  placeholder="Enter service name..."
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content *</Label>
                <FroalaTextEditor 
                  value={formData.content}
                  onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
                  placeholder="Write your service content here..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image">Image (optional)</Label>
                <Input id="edit-image" type="file" accept="image/*" onChange={handleImageChange} />
                {editingService?.image_path && (
                  <p className="text-xs text-muted-foreground">Current image: {editingService.image_path}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Service"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}