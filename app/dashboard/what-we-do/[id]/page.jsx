"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { FroalaTextEditor } from "@/components/rich-text-editor"

const API_BASE_URL = "http://ai.l4it.net:8000"

export default function InfoDetailPage() {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    image: null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  const { token, user, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const infoId = params.id

  // Check if current user is the owner
  const isOwner = info && user && info.user_id === user.id

  // Function to get proper image URL - IMPROVED VERSION (same as services)
  const getImageUrl = useCallback((image) => {
    console.log("getImageUrl called with:", image)
    
    // Return placeholder immediately if no image
    if (!image || image === undefined || image === null || image === '') {
      return "/placeholder.svg?height=800&width=1600"
    }
    
    if (typeof image === 'string' && (image.startsWith("http://") || image.startsWith("https://"))) {
      return image
    }
    
    // Handle the specific format from your API: "/static/uploads/info.jpeg"
    if (typeof image === 'string' && image.startsWith("/static/")) {
      return `${API_BASE_URL}${image}`
    }
    
    // Handle format without leading slash: "static/uploads/info.jpeg"
    if (typeof image === 'string' && image.startsWith("static/")) {
      return `${API_BASE_URL}/${image}`
    }
    
    if (typeof image === 'string') {
      return `${API_BASE_URL}/static/uploads/${image}`
    }
    
    // Fallback to placeholder
    return "/placeholder.svg?height=800&width=1600"
  }, [])

  // Fetch info details
  const fetchInfo = useCallback(async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/info/${infoId}`, {
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
      console.log("Fetched info data:", data)
      setInfo(data)
      setFormData({
        name: data.name || "",
        content: data.content || "",
        image: null,
      })
      setError(null)
      setImageError(false)
    } catch (err) {
      setError(`Failed to fetch info: ${err.message}`)
      console.error("Error fetching info:", err)
    } finally {
      setLoading(false)
    }
  }, [token, infoId, logout, router])

  // Update info
  const updateInfo = useCallback(async (infoData) => {
    if (!token || !isOwner) {
      setError("You don't have permission to edit this information.")
      return
    }

    try {
      setSubmitting(true)
      const formDataToSend = new FormData()

      Object.keys(infoData).forEach((key) => {
        if (key === "image" && infoData[key]) {
          formDataToSend.append(key, infoData[key])
        } else if (key !== "image") {
          formDataToSend.append(key, infoData[key])
        }
      })

      const response = await fetch(`${API_BASE_URL}/info/${infoId}`, {
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
          setError("You don't have permission to edit this information.")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updatedInfo = await response.json()
      setInfo(updatedInfo)
      setSuccess("Information updated successfully!")
      setIsEditDialogOpen(false)
      
      // Reset the image error state when info is updated
      setImageError(false)
    } catch (err) {
      setError(`Failed to update information: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }, [token, isOwner, infoId, logout, router])

  // Delete info
  const deleteInfo = useCallback(async () => {
    if (!token || !isOwner) {
      setError("You don't have permission to delete this information.")
      return
    }

    if (!confirm("Are you sure you want to delete this information? This action cannot be undone.")) return

    try {
      const response = await fetch(`${API_BASE_URL}/info/${infoId}`, {
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
          setError("You don't have permission to delete this information.")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setSuccess("Information deleted successfully!")
      setTimeout(() => {
        router.push("/dashboard/what-we-do")
      }, 1500)
    } catch (err) {
      setError(`Failed to delete information: ${err.message}`)
    }
  }, [token, isOwner, infoId, logout, router])

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError("Name is required")
      return
    }

    if (!formData.content.trim()) {
      setError("Content is required")
      return
    }

    updateInfo(formData)
  }, [formData, updateInfo])

  // Handle file input change
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0]
    setFormData((prev) => ({ ...prev, image: file }))
  }, [])

  // Handle input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Open edit dialog
  const openEditDialog = useCallback(() => {
    if (!isOwner) {
      setError("You don't have permission to edit this information.")
      return
    }
    setFormData({ 
      name: info.name || "", 
      content: info.content || "", 
      image: null 
    })
    setIsEditDialogOpen(true)
  }, [isOwner, info])

  // Handle image error - IMPROVED VERSION (same as services)
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
    if (token && infoId) {
      fetchInfo()
    }
  }, [token, infoId, fetchInfo])

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
        <span className="ml-2">Loading information...</span>
      </div>
    )
  }

  if (!info) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Information not found</h3>
              <p className="text-muted-foreground">
                The information you're looking for doesn't exist or has been deleted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const contentLength = countCharacters(info.content)
  const wordCount = countWords(info.content)
  
  // Get the correct image field - check both possible field names (same as services)
  const infoImagePath = info.image_path || info.image || null
  const imageUrl = getImageUrl(infoImagePath)

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
              {info.name || `Section #${info.id}`}
            </h1>
            <p className="text-muted-foreground">View and manage section information</p>
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={openEditDialog}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={deleteInfo}>
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

      {/* Info Details */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {info.name || `Section #${info.id}`}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">Active</Badge>
                  {isOwner && <Badge variant="secondary">Owner</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Section Name */}
              {info.name && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Section Name</h3>
                  <p className="text-lg font-medium">{info.name}</p>
                </div>
              )}

              {/* Info Image Section - IMPROVED VERSION (same as services) */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Section Image</h3>
                <div className="aspect-video relative overflow-hidden rounded-lg bg-muted border-2 border-dashed border-muted-foreground/25">
                  {infoImagePath && !imageError ? (
                    <img
                      src={imageUrl}
                      alt="Section image"
                      className="object-cover w-full h-full"
                      onError={handleImageError}
                      onLoad={() => setImageError(false)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-16 w-16 mb-4" />
                      <p className="text-lg font-medium">
                        {infoImagePath ? "Image failed to load" : "No section image"}
                      </p>
                      {infoImagePath && (
                        <>
                          <p className="text-sm text-center px-4 mt-2">Path: {infoImagePath}</p>
                          <p className="text-xs text-center px-4 mt-1 text-red-500">URL: {imageUrl}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Content</h3>
                <div className="prose max-w-none overflow-hidden">
                  <div
                    className="leading-relaxed break-words overflow-wrap-anywhere hyphens-auto"
                    dangerouslySetInnerHTML={{ __html: info?.content || "No content available" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Information Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">ID:</span> {info.id}
              </div>
              {info.name && (
                <div>
                  <span className="font-medium">Name:</span> {info.name}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Owner ID:</span> {info.user_id}
                  {isOwner && <span className="ml-2 text-green-600">(You)</span>}
                </span>
              </div>
              {info.created_at && (
                <div>
                  <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Created:</span> {new Date(info.created_at).toLocaleString()}
                  </span>
                </div>
              )}
              {info.updated_at && (
                <div>
                  <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Updated:</span> {new Date(info.updated_at).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Display all other fields from the API */}
              {Object.keys(info).map((key) => {
                if (
                  ![
                    "id",
                    "name",
                    "user_id",
                    "created_at",
                    "updated_at",
                    "content",
                    "image_path",
                    "image",
                  ].includes(key) &&
                  info[key] !== null &&
                  info[key] !== undefined &&
                  info[key] !== ""
                ) {
                  return (
                    <div key={key}>
                      <span className="font-medium">
                        {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
                      </span>{" "}
                      {String(info[key])}
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
                <span className="font-medium">Section Image:</span>{" "}
                {infoImagePath ? (imageError ? "Error loading" : "Available") : "Not set"}
              </div>
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
                    ? "You have full access to edit and delete this information as you are the owner."
                    : "You can view this information but cannot edit or delete it as you are not the owner."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>Update the section name, content and image.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter section name..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">Content *</Label>
                <FroalaTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
                  placeholder="Enter section content..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-image">Image (optional)</Label>
                <Input id="edit-image" type="file" accept="image/*" onChange={handleImageChange} />
                {infoImagePath && <p className="text-xs text-muted-foreground">Current image: {infoImagePath}</p>}
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
                  "Update Section"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}