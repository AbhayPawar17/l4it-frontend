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
import { FroalaTextEditor } from "../../../../components/rich-text-editor"

const API_BASE_URL = "http://ai.l4it.net:8000"

export default function CaseStudyDetailPage() {
  const [caseStudy, setCaseStudy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [formData, setFormData] = useState({ 
    heading: "",
    short_description: "",
    content: "", 
    meta_title: "",
    meta_description: "",
    image: null 
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  const { token, user, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const caseStudyId = params.id

  // Check if current user is the owner
  const isOwner = caseStudy && user && caseStudy.user_id === user.id

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
    
    // Handle the specific format from your API: "/static/uploads/case_study.jpeg"
    if (typeof image === 'string' && image.startsWith("/static/")) {
      return `${API_BASE_URL}${image}`
    }
    
    // Handle format without leading slash: "static/uploads/case_study.jpeg"
    if (typeof image === 'string' && image.startsWith("static/")) {
      return `${API_BASE_URL}/${image}`
    }
    
    if (typeof image === 'string') {
      return `${API_BASE_URL}/static/uploads/${image}`
    }
    
    // Fallback to placeholder
    return "/placeholder.svg?height=800&width=1600"
  }, [])

  // Fetch case study details
  const fetchCaseStudy = useCallback(async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/case-studies/${caseStudyId}`, {
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
      console.log("Fetched case study data:", data)
      setCaseStudy(data)
      setFormData({ 
        heading: data.heading || "",
        short_description: data.short_description || "",
        content: data.content || "", 
        meta_title: data.meta_title || "",
        meta_description: data.meta_description || "",
        image: null 
      })
      setError(null)
      setImageError(false)
    } catch (err) {
      setError(`Failed to fetch case study: ${err.message}`)
      console.error("Error fetching case study:", err)
    } finally {
      setLoading(false)
    }
  }, [token, caseStudyId, logout, router])

  // Update case study
  const updateCaseStudy = useCallback(
    async (caseStudyData, image) => {
      if (!token || !isOwner) {
        setError("You don't have permission to edit this case study.")
        return
      }

      try {
        setSubmitting(true)
        const formData = new FormData()
        formData.append("heading", caseStudyData.heading)
        formData.append("short_description", caseStudyData.short_description)
        formData.append("content", caseStudyData.content)
        formData.append("meta_title", caseStudyData.meta_title)
        formData.append("meta_description", caseStudyData.meta_description)
        if (image) {
          formData.append("image", image)
        }

        const response = await fetch(`${API_BASE_URL}/case-studies/${caseStudyId}`, {
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
            setError("You don't have permission to edit this case study.")
            return
          }
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        const updatedCaseStudy = await response.json()
        setCaseStudy(updatedCaseStudy)
        setSuccess("Case study updated successfully!")
        setIsEditDialogOpen(false)
        setImageError(false)
        
        // Reset the image error state when case study is updated
        setImageError(false)
      } catch (err) {
        setError(`Failed to update case study: ${err.message}`)
      } finally {
        setSubmitting(false)
      }
    },
    [token, isOwner, caseStudyId, logout, router],
  )

  // Delete case study
  const deleteCaseStudy = useCallback(async () => {
    if (!token || !isOwner) {
      setError("You don't have permission to delete this case study.")
      return
    }

    if (!confirm("Are you sure you want to delete this case study? This action cannot be undone.")) return

    try {
      const response = await fetch(`${API_BASE_URL}/case-studies/${caseStudyId}`, {
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
          setError("You don't have permission to delete this case study.")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setSuccess("Case study deleted successfully!")
      setTimeout(() => {
        router.push("/dashboard/case-studies")
      }, 1500)
    } catch (err) {
      setError(`Failed to delete case study: ${err.message}`)
    }
  }, [token, isOwner, caseStudyId, logout, router])

  // Handle form submission
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      const { heading, short_description, content, meta_title, meta_description, image } = formData

      if (!heading.trim()) {
        setError("Heading is required")
        return
      }

      if (!short_description.trim()) {
        setError("Short description is required")
        return
      }

      if (!content.trim()) {
        setError("Content is required")
        return
      }

      updateCaseStudy({ heading, short_description, content, meta_title, meta_description }, image)
    },
    [formData, updateCaseStudy],
  )

  // Handle form data changes
  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Handle file input change
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0]
    setFormData((prev) => ({ ...prev, image: file }))
  }, [])

  // Open edit dialog
  const openEditDialog = useCallback(() => {
    if (!isOwner) {
      setError("You don't have permission to edit this case study.")
      return
    }
    setFormData({ 
      heading: caseStudy.heading || "",
      short_description: caseStudy.short_description || "",
      content: caseStudy.content || "", 
      meta_title: caseStudy.meta_title || "",
      meta_description: caseStudy.meta_description || "",
      image: null 
    })
    setIsEditDialogOpen(true)
  }, [isOwner, caseStudy])

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
    if (token && caseStudyId) {
      fetchCaseStudy()
    }
  }, [token, caseStudyId, fetchCaseStudy])

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
        <span className="ml-2">Loading case study...</span>
      </div>
    )
  }

  if (!caseStudy) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Case study not found</h3>
              <p className="text-muted-foreground">The case study you're looking for doesn't exist or has been deleted.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const headingLength = countCharacters(caseStudy.heading)
  const shortDescriptionLength = countCharacters(caseStudy.short_description)
  const contentLength = countCharacters(caseStudy.content)
  const wordCount = countWords(caseStudy.content)
  
  // Get the correct image field - check both possible field names (same as services)
  const caseStudyImagePath = caseStudy.image_path || caseStudy.image || null
  const imageUrl = getImageUrl(caseStudyImagePath)

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
            <h1 className="text-3xl font-bold tracking-tight">Case Study #{caseStudy.id}</h1>
            <p className="text-muted-foreground">View and manage case study details</p>
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={openEditDialog}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={deleteCaseStudy}>
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

      {/* Case Study Details */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Case Study Content</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">Active</Badge>
                  {isOwner && <Badge variant="secondary">Owner</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Case Study Image Section - IMPROVED VERSION (same as services) */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Case Study Image</h3>
                <div className="aspect-video relative overflow-hidden rounded-lg bg-muted border-2 border-dashed border-muted-foreground/25">
                  {caseStudyImagePath && !imageError ? (
                    <img
                      src={imageUrl}
                      alt="Case study image"
                      className="object-cover w-full h-full"
                      onError={handleImageError}
                      onLoad={() => setImageError(false)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-16 w-16 mb-4" />
                      <p className="text-lg font-medium">
                        {caseStudyImagePath ? "Image failed to load" : "No case study image"}
                      </p>
                      {caseStudyImagePath && (
                        <>
                          <p className="text-sm text-center px-4 mt-2">Path: {caseStudyImagePath}</p>
                          <p className="text-xs text-center px-4 mt-1 text-red-500">URL: {imageUrl}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Heading Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Case Study Title</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <h2 className="text-2xl font-bold text-foreground">
                    {caseStudy.heading || "No title available"}
                  </h2>
                </div>
              </div>

              {/* Short Description Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Short Description</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-muted-foreground leading-relaxed">
                    {caseStudy.short_description || "No short description available"}
                  </p>
                </div>
              </div>

              {/* Content Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Case Study Content</h3>
                <div className="prose max-w-none overflow-hidden">
                  <div
                    dangerouslySetInnerHTML={{ __html: caseStudy.content || "No content available" }}
                    className="leading-relaxed break-words overflow-wrap-anywhere hyphens-auto"
                  />
                </div>
              </div>

              {/* SEO Meta Information */}
              {(caseStudy.meta_title || caseStudy.meta_description) && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">SEO Meta Information</h3>
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    {caseStudy.meta_title && (
                      <div>
                        <span className="font-medium text-sm">Meta Title:</span>
                        <p className="text-sm text-muted-foreground mt-1">{caseStudy.meta_title}</p>
                      </div>
                    )}
                    {caseStudy.meta_description && (
                      <div>
                        <span className="font-medium text-sm">Meta Description:</span>
                        <p className="text-sm text-muted-foreground mt-1">{caseStudy.meta_description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Case Study Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">Case Study ID:</span> {caseStudy.id}
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Owner ID:</span> {caseStudy.user_id}
                  {isOwner && <span className="ml-2 text-green-600">(You)</span>}
                </span>
              </div>
              {caseStudy.created_at && (
                <div>
                  <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Created:</span> {new Date(caseStudy.created_at).toLocaleString()}
                  </span>
                </div>
              )}
              {caseStudy.updated_at && (
                <div>
                  <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Updated:</span> {new Date(caseStudy.updated_at).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Display all other fields from the API */}
              {Object.keys(caseStudy).map((key) => {
                if (
                  !["id", "user_id", "created_at", "updated_at", "heading", "short_description", "content", "meta_title", "meta_description", "image", "image_path"].includes(key) &&
                  caseStudy[key] !== null &&
                  caseStudy[key] !== undefined &&
                  caseStudy[key] !== ""
                ) {
                  return (
                    <div key={key}>
                      <span className="font-medium">
                        {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
                      </span>{" "}
                      {String(caseStudy[key])}
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
                <span className="font-medium">Heading Length:</span> {headingLength} characters
              </div>
              <div>
                <span className="font-medium">Short Description Length:</span> {shortDescriptionLength} characters
              </div>
              <div>
                <span className="font-medium">Content Length:</span> {contentLength} characters
              </div>
              <div>
                <span className="font-medium">Word Count:</span> {wordCount} words
              </div>
              <div>
                <span className="font-medium">Case Study Image:</span>{" "}
                {caseStudyImagePath ? (imageError ? "Error loading" : "Available") : "Not set"}
              </div>
              <div>
                <span className="font-medium">SEO Meta Title:</span> {caseStudy.meta_title ? "Set" : "Not set"}
              </div>
              <div>
                <span className="font-medium">SEO Meta Description:</span> {caseStudy.meta_description ? "Set" : "Not set"}
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
                    ? "You have full access to edit and delete this case study as you are the owner."
                    : "You can view this case study but cannot edit or delete it as you are not the owner."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Case Study</DialogTitle>
            <DialogDescription>Update the case study information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-3">
              <div className="space-y-2">
                <Label htmlFor="edit-heading">Heading *</Label>
                <Input
                  id="edit-heading"
                  value={formData.heading}
                  onChange={(e) => handleFormChange("heading", e.target.value)}
                  placeholder="Enter case study heading..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-short_description">Short Description *</Label>
                <Textarea
                  id="edit-short_description"
                  value={formData.short_description}
                  onChange={(e) => handleFormChange("short_description", e.target.value)}
                  placeholder="Enter a brief description..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content *</Label>
                <FroalaTextEditor 
                  value={formData.content}
                  onChange={(value) => handleFormChange("content", value)}
                  placeholder="Write your case study content here..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-meta_title">Meta Title</Label>
                <Input
                  id="edit-meta_title"
                  value={formData.meta_title}
                  onChange={(e) => handleFormChange("meta_title", e.target.value)}
                  placeholder="SEO meta title..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-meta_description">Meta Description</Label>
                <Textarea
                  id="edit-meta_description"
                  value={formData.meta_description}
                  onChange={(e) => handleFormChange("meta_description", e.target.value)}
                  placeholder="SEO meta description..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image">Image (optional)</Label>
                <Input id="edit-image" type="file" accept="image/*" onChange={handleImageChange} />
                {caseStudyImagePath && (
                  <p className="text-xs text-muted-foreground">Current image: {caseStudyImagePath}</p>
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
                  "Update Case Study"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}