"use client"

import { useState, useEffect } from "react"
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
import { RichTextEditor } from "../../../../components/rich-text-editor"

const API_BASE_URL = "http://ai.l4it.net:8000"

export default function ServiceDetailPage() {
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [formData, setFormData] = useState({ content: "", image: null })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  const { token, user, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const serviceId = params.id

  // Check if current user is the owner
  const isOwner = service && user && service.user_id === user.id

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

  // Fetch service details
  const fetchService = async () => {
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
      setService(data)
      setFormData({ content: data.content || "", image: null })
      setError(null)
      setImageError(false)
    } catch (err) {
      setError(`Failed to fetch service: ${err.message}`)
      console.error("Error fetching service:", err)
    } finally {
      setLoading(false)
    }
  }

  // Update service
  const updateService = async (content, image) => {
    if (!token || !isOwner) {
      setError("You don't have permission to edit this service.")
      return
    }

    try {
      setSubmitting(true)
      const formData = new FormData()
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
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updatedService = await response.json()
      setService(updatedService)
      setSuccess("Service updated successfully!")
      setIsEditDialogOpen(false)
      setImageError(false)
    } catch (err) {
      setError(`Failed to update service: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete service
  const deleteService = async () => {
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
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    const { content, image } = formData

    if (!content.trim()) {
      setError("Content is required")
      return
    }

    updateService(content, image)
  }

  // Handle file input change
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setFormData((prev) => ({ ...prev, image: file }))
  }

  // Open edit dialog
  const openEditDialog = () => {
    if (!isOwner) {
      setError("You don't have permission to edit this service.")
      return
    }
    setFormData({ content: service.content || "", image: null })
    setIsEditDialogOpen(true)
  }

  // Handle image error
  const handleImageError = () => {
    setImageError(true)
  }

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
  }, [token, serviceId])

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
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Service not found</h3>
              <p className="text-muted-foreground">The service you're looking for doesn't exist or has been deleted.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const contentLength = countCharacters(service.content)
  const wordCount = countWords(service.content)
  const imageUrl = getImageUrl(service.image_path)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service #{service.id}</h1>
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
              {/* Service Image Section - Always Display */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Service Image</h3>
                <div className="aspect-video relative overflow-hidden rounded-lg bg-muted border-2 border-dashed border-muted-foreground/25">
                  {service.image_path || !imageError ? (
                    <img
                      src={getImageUrl(service.image_path) || "/placeholder.svg"}
                      alt="Service image"
                      className="object-cover w-full h-full"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-16 w-16 mb-4" />
                      <p className="text-lg font-medium">Image failed to load</p>
                      <p className="text-sm text-center px-4">Path: {service.image_path}</p>
                    </div>
                  )}
                </div>
                {service.image_path && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      <span className="font-medium">Image Path:</span> {service.image_path}
                    </div>
                    <div>
                      <span className="font-medium">Full URL:</span> {getImageUrl(service.image_path)}
                    </div>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Service Description</h3>
                <div className="prose max-w-none">
                  <div
                    dangerouslySetInnerHTML={{ __html: service.content || "No content available" }}
                    className="leading-relaxed"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">Service ID:</span> {service.id}
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Owner ID:</span> {service.user_id}
                  {isOwner && <span className="ml-2 text-green-600">(You)</span>}
                </span>
              </div>
              {service.created_at && (
                <div>
                  <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Created:</span> {new Date(service.created_at).toLocaleString()}
                  </span>
                </div>
              )}
              {service.updated_at && (
                <div>
                  <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Updated:</span> {new Date(service.updated_at).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Display all other fields from the API */}
              {Object.keys(service).map((key) => {
                if (
                  !["id", "user_id", "created_at", "updated_at", "content", "image_path"].includes(key) &&
                  service[key] !== null &&
                  service[key] !== undefined &&
                  service[key] !== ""
                ) {
                  return (
                    <div key={key}>
                      <span className="font-medium">
                        {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
                      </span>{" "}
                      {String(service[key])}
                    </div>
                  )
                }
                return null
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">Content Length:</span> {contentLength} characters
              </div>
              <div>
                <span className="font-medium">Word Count:</span> {wordCount} words
              </div>
              <div>
                <span className="font-medium">Service Image:</span>{" "}
                {service.image_path ? (imageError ? "Error loading" : "Available") : "Not set"}
              </div>
              {service.image_path && (
                <div>
                  <span className="font-medium">Image Status:</span>{" "}
                  {imageError ? "Failed to load" : "Successfully loaded"}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Access Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center">
                  <Shield className="h-5 w-5 mr-2 text-muted-foreground" />
                  <Badge variant={isOwner ? "default" : "outline"}>{isOwner ? "Full Access" : "Read Only"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isOwner
                    ? "You have full access to edit and delete this service as you are the owner."
                    : "You can view this service but cannot edit or delete it as you are not the owner."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update the service content and image.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content *</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
                  placeholder="Write your service content here..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image">Image (optional)</Label>
                <Input id="edit-image" type="file" accept="image/*" onChange={handleImageChange} />
                {service.image_path && (
                  <p className="text-xs text-muted-foreground">Current image: {service.image_path}</p>
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
