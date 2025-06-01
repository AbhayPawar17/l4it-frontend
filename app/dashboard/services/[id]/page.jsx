"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Shield,
  ImageIcon,
} from "lucide-react"
import { useAuth } from "../../../../contexts/auth-context"
import { FroalaTextEditor } from "../../../../components/rich-text-editor"

const API_BASE_URL = "http://localhost:8000"

export default function ServiceDetailPage() {
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [formData, setFormData] = useState({ name: "", content: "", image: null })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  const { token, user, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const serviceId = params.id
  console.log("checking", service)
  console.log("another checking", user)
  // Check if current user is the owner
  const isOwner = service && user && service.author_email === user.email

  // Function to get proper image URL - IMPROVED VERSION (same as blog)
  const getImageUrl = useCallback((image) => {
    console.log("getImageUrl called with:", image)
    
    // Return placeholder immediately if no image
    if (!image || image === undefined || image === null || image === '') {
      return "/placeholder.svg?height=800&width=1600"
    }
    
    if (typeof image === 'string' && (image.startsWith("http://") || image.startsWith("https://"))) {
      return image
    }
    
    // Handle the specific format from your API: "/static/uploads/service3.jpeg"
    if (typeof image === 'string' && image.startsWith("/static/")) {
      return `${API_BASE_URL}${image}`
    }
    
    // Handle format without leading slash: "static/uploads/service3.jpeg"
    if (typeof image === 'string' && image.startsWith("static/")) {
      return `${API_BASE_URL}/${image}`
    }
    
    if (typeof image === 'string') {
      return `${API_BASE_URL}/static/uploads/${image}`
    }
    
    // Fallback to placeholder
    return "/placeholder.svg?height=800&width=1600"
  }, [])

  // Fetch service details
  const fetchService = useCallback(async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/msp-services/${serviceId}`, {
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
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched service data:", data)
      setService(data)
      setFormData({ name: data.name || "", content: data.content || "", image: null })
      setError(null)
      setImageError(false)
    } catch (err) {
      setError(`Failed to fetch service: ${err.message}`)
      console.error("Error fetching service:", err)
    } finally {
      setLoading(false)
    }
  }, [token, serviceId, logout, router])

  // Update service
  const updateService = useCallback(
    async (name, content, image) => {
      if (!token || !isOwner) {
        setError("You don't have permission to edit this service.")
        return
      }

      try {
        setSubmitting(true)
        const formDataToSend = new FormData()
        formDataToSend.append("name", name)
        formDataToSend.append("content", content)
        if (image) {
          formDataToSend.append("image", image)
        }

        const response = await fetch(`${API_BASE_URL}/msp-services/${serviceId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
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
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const updatedService = await response.json()
        setService(updatedService)
        setSuccess("Service updated successfully!")
        setIsEditDialogOpen(false)
        setImageError(false)
        
        // Reset the image error state when service is updated
        setImageError(false)
      } catch (err) {
        setError(`Failed to update service: ${err.message}`)
      } finally {
        setSubmitting(false)
      }
    },
    [token, isOwner, serviceId, logout, router],
  )

  // Delete service
  const deleteService = useCallback(async () => {
    if (!token || !isOwner) {
      setError("You don't have permission to delete this service.")
      return
    }

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

      setSuccess("Service deleted successfully!")
      setTimeout(() => {
        router.push("/dashboard/services")
      }, 1500)
    } catch (err) {
      setError(`Failed to delete service: ${err.message}`)
    }
  }, [token, isOwner, serviceId, logout, router])

  // Handle form submission
  const handleSubmit = useCallback(
    (e) => {
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

      updateService(name, content, image)
    },
    [formData, updateService],
  )

  // Handle file input change
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0]
    setFormData((prev) => ({ ...prev, image: file }))
  }, [])

  // Open edit dialog
  const openEditDialog = useCallback(() => {
    if (!isOwner) {
      setError("You don't have permission to edit this service.")
      return
    }
    setFormData({ name: service.name || "", content: service.content || "", image: null })
    setIsEditDialogOpen(true)
  }, [isOwner, service])

  // Handle image error - IMPROVED VERSION (same as blog)
  const handleImageError = useCallback((e) => {
    console.error("Image failed to load:", e.target.src)
    setImageError(true)
  }, [])

  // Navigate back using client-side navigation
  const goBack = useCallback(() => {
    router.back()
  }, [router])

  // Function to count characters
  const countCharacters = (text) => {
    return text ? text.length : 0
  }

  // Function to count words
  const countWords = (text) => {
    if (!text) return 0
    return text
      .replace(/<[^>]*>/g, "")
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  useEffect(() => {
    if (token && serviceId) {
      fetchService()
    }
  }, [token, serviceId, fetchService])

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
        <span className="ml-2">Loading service...</span>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Service not found</h3>
              <p className="text-muted-foreground">
                The service you're looking for doesn't exist or has been deleted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const contentLength = countCharacters(service.content)
  const wordCount = countWords(service.content)
  
  // Get the correct image field - check both possible field names (same as blog)
  const serviceImagePath = service.image_path || service.image || null
  const imageUrl = getImageUrl(serviceImagePath)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {service.name || `Service #${service.id}`}
            </h1>
            <p className="text-muted-foreground">View and manage service details</p>
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={openEditDialog}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={deleteService}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
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

      {/* Service Details */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Service Content</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">Active</Badge>
                  {isOwner && <Badge variant="secondary">Owner</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Service Name Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Service Name</h3>
                <p className="text-base font-medium text-foreground bg-muted p-3 rounded-md">
                  {service.name || "No name provided"}
                </p>
              </div>

              {/* Service Image Section - IMPROVED VERSION (same as blog) */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Service Image</h3>
                <div className="aspect-video relative overflow-hidden rounded-lg bg-muted border-2 border-dashed border-muted-foreground/25">
                  {serviceImagePath && !imageError ? (
                    <img
                      src={imageUrl}
                      alt="Service image"
                      className="object-cover w-full h-full"
                      onError={handleImageError}
                      onLoad={() => setImageError(false)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-16 w-16 mb-4" />
                      <p className="text-lg font-medium">
                        {serviceImagePath ? "Image failed to load" : "No service image"}
                      </p>
                      {serviceImagePath && (
                        <>
                          <p className="text-sm text-center px-4 mt-2">Path: {serviceImagePath}</p>
                          <p className="text-xs text-center px-4 mt-1 text-red-500">URL: {imageUrl}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Service Description</h3>
                <div className="prose max-w-none overflow-hidden">
                  <div
                    dangerouslySetInnerHTML={{ __html: service.content || "No content available" }}
                    className="leading-relaxed break-words overflow-wrap-anywhere hyphens-auto"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Author Name:</span> {service.author_email?.split('@')[0]}
                  {isOwner && <span className="ml-2 text-green-600">(You)</span>}
                </span>
              </div>
              {service.created_at && (
                <div>
                  <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Created Date:</span> {new Date(service?.created_at).toLocaleDateString() || "N/A"}
                  </span>
                </div>
              )}
              {service.updated_at && (
                <div>
                  <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Updated Date:</span> {new Date(service?.created_at).toLocaleDateString() || "N/A"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update the service name, content and image.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
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
                {serviceImagePath && <p className="text-xs text-muted-foreground">Current image: {serviceImagePath}</p>}
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