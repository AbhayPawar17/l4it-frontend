"use client"

import { useState, useEffect } from "react"
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
import { RichTextEditor } from "../../../../components/rich-text-editor"

const API_BASE_URL = "http://localhost:8000"

export default function BlogDetailPage() {
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [formData, setFormData] = useState({
    image: null,
    heading: "",
    short_description: "",
    content: "",
    meta_title: "",
    meta_description: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  const { token, user, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const blogId = params.id

  // Check if current user is the owner
  const isOwner = blog && user && blog.user_id === user.id

  // Function to get proper image URL
  const getImageUrl = (image) => {
    if (!image) return "/placeholder.svg?height=800&width=1600"
    if (image.startsWith("http")) return image

    // Handle static uploads path
    if (image.startsWith("/static/")) {
      return `http://localhost:8000${image}`
    }

    // If it's just a filename or relative path, assume it's in static/uploads
    const cleanPath = image.startsWith("/") ? image : `/static/uploads/${image}`
    return `http://localhost:8000${cleanPath}`
  }

  // Fetch blog details
  const fetchBlog = async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/blog/${blogId}`, {
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
      setBlog(data)
      setFormData({
        image: null,
        heading: data.heading || "",
        short_description: data.short_description || "",
        content: data.content || "",
        meta_title: data.meta_title || "",
        meta_description: data.meta_description || "",
      })
      setError(null)
      setImageError(false)
    } catch (err) {
      setError(`Failed to fetch blog: ${err.message}`)
      console.error("Error fetching blog:", err)
    } finally {
      setLoading(false)
    }
  }

  // Update blog
  const updateBlog = async (blogData) => {
    if (!token || !isOwner) {
      setError("You don't have permission to edit this blog post.")
      return
    }

    try {
      setSubmitting(true)
      const formDataToSend = new FormData()

      Object.keys(blogData).forEach((key) => {
        if (key === "image" && blogData[key]) {
          formDataToSend.append(key, blogData[key])
        } else if (key !== "image") {
          formDataToSend.append(key, blogData[key])
        }
      })

      const response = await fetch(`${API_BASE_URL}/blog/${blogId}`, {
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
          setError("You don't have permission to edit this blog post.")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updatedBlog = await response.json()
      setBlog(updatedBlog)
      setSuccess("Blog updated successfully!")
      setIsEditDialogOpen(false)
      setImageError(false)
    } catch (err) {
      setError(`Failed to update blog: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete blog
  const deleteBlog = async () => {
    if (!token || !isOwner) {
      setError("You don't have permission to delete this blog post.")
      return
    }

    if (!confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) return

    try {
      const response = await fetch(`${API_BASE_URL}/blog/${blogId}`, {
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
          setError("You don't have permission to delete this blog post.")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setSuccess("Blog deleted successfully!")
      setTimeout(() => {
        router.push("/dashboard/blogs")
      }, 1500)
    } catch (err) {
      setError(`Failed to delete blog: ${err.message}`)
    }
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.heading.trim()) {
      setError("Heading is required")
      return
    }

    if (!formData.short_description.trim()) {
      setError("Short description is required")
      return
    }

    if (!formData.content.trim()) {
      setError("Content is required")
      return
    }

    updateBlog(formData)
  }

  // Handle file input change
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setFormData((prev) => ({ ...prev, image: file }))
  }

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Open edit dialog
  const openEditDialog = () => {
    if (!isOwner) {
      setError("You don't have permission to edit this blog post.")
      return
    }
    setIsEditDialogOpen(true)
  }

  // Handle image error
  const handleImageError = () => {
    setImageError(true)
  }

  useEffect(() => {
    if (token && blogId) {
      fetchBlog()
    }
  }, [token, blogId])

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
        <span className="ml-2">Loading blog...</span>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Blog post not found</h3>
              <p className="text-muted-foreground">
                The blog post you're looking for doesn't exist or has been deleted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Function to estimate reading time
  const estimateReadingTime = (content) => {
    if (!content) return 0
    const wordsPerMinute = 200
    const wordCount = content
      .replace(/<[^>]*>/g, "")
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
    const readingTimeMinutes = wordCount / wordsPerMinute
    return Math.ceil(readingTimeMinutes)
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

  const readingTime = estimateReadingTime(blog.content)
  const contentLength = countCharacters(blog.content)
  const wordCount = countWords(blog.content)
  const metaTitleLength = countCharacters(blog.meta_title)
  const metaDescriptionLength = countCharacters(blog.meta_description)
  const imageUrl = getImageUrl(blog.image_path)

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
            <h1 className="text-3xl font-bold tracking-tight line-clamp-2">{blog.heading}</h1>
            <p className="text-muted-foreground">{blog.short_description}</p>
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={openEditDialog}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={deleteBlog}>
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

      {/* Blog Content */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">Published</Badge>
                    {isOwner && <Badge variant="secondary">Owner</Badge>}
                  </div>
                  {blog.meta_title && <p className="text-sm text-muted-foreground">Meta Title: {blog.meta_title}</p>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Featured Image Section - Always Display */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Featured Image</h3>
                <div className="aspect-video relative overflow-hidden rounded-lg bg-muted border-2 border-dashed border-muted-foreground/25">
                  {blog.image_path || !imageError ? (
                    <img
                      src={getImageUrl(blog.image_path) || "/placeholder.svg"}
                      alt={blog.heading}
                      className="object-cover w-full h-full"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-16 w-16 mb-4" />
                      <p className="text-lg font-medium">Image failed to load</p>
                      <p className="text-sm text-center px-4">Path: {blog.image_path}</p>
                    </div>
                  )}
                </div>
                {blog.image_path && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      <span className="font-medium">Image Path:</span> {blog.image_path}
                    </div>
                    <div>
                      <span className="font-medium">Full URL:</span> {getImageUrl(blog.image_path)}
                    </div>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Blog Content</h3>
                <div className="prose max-w-none">
                  <div
                    dangerouslySetInnerHTML={{ __html: blog.content || "No content available" }}
                    className="leading-relaxed"
                  />
                </div>
              </div>

              {/* Meta Description Section */}
              {blog.meta_description && (
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Meta Description:</h4>
                  <p className="text-sm text-muted-foreground">{blog.meta_description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Blog Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">Blog ID:</span> {blog.id}
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Author ID:</span> {blog.user_id}
                  {isOwner && <span className="ml-2 text-green-600">(You)</span>}
                </span>
              </div>
              {blog.created_at && (
                <div>
                  <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Created:</span> {new Date(blog.created_at).toLocaleString()}
                  </span>
                </div>
              )}
              {blog.updated_at && (
                <div>
                  <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Updated:</span> {new Date(blog.updated_at).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Display all other fields from the API */}
              {Object.keys(blog).map((key) => {
                if (
                  ![
                    "id",
                    "user_id",
                    "created_at",
                    "updated_at",
                    "heading",
                    "short_description",
                    "content",
                    "meta_title",
                    "meta_description",
                    "image_path",
                  ].includes(key) &&
                  blog[key] !== null &&
                  blog[key] !== undefined &&
                  blog[key] !== ""
                ) {
                  return (
                    <div key={key}>
                      <span className="font-medium">
                        {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
                      </span>{" "}
                      {String(blog[key])}
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
                <span className="font-medium">Reading Time:</span> {readingTime} minutes
              </div>
              <div>
                <span className="font-medium">Featured Image:</span>{" "}
                {blog.image_path ? (imageError ? "Error loading" : "Available") : "Not set"}
              </div>
              <div>
                <span className="font-medium">Heading Length:</span> {countCharacters(blog.heading)} characters
              </div>
              <div>
                <span className="font-medium">Description Length:</span> {countCharacters(blog.short_description)}{" "}
                characters
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SEO Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">Meta Title:</span> {blog.meta_title || "N/A"} ({metaTitleLength}{" "}
                characters)
              </div>
              <div>
                <span className="font-medium">Meta Description:</span> {blog.meta_description || "N/A"} (
                {metaDescriptionLength} characters)
              </div>
              <div>
                {metaTitleLength === 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Meta title is missing. Add one for better SEO.</AlertDescription>
                  </Alert>
                ) : metaTitleLength < 50 || metaTitleLength > 60 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Meta title should be between 50-60 characters for optimal SEO.</AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>Meta title length is optimal for SEO.</AlertDescription>
                  </Alert>
                )}
              </div>
              <div>
                {metaDescriptionLength === 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Meta description is missing. Add one for better SEO.</AlertDescription>
                  </Alert>
                ) : metaDescriptionLength < 150 || metaDescriptionLength > 160 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Meta description should be between 150-160 characters for optimal SEO.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>Meta description length is optimal for SEO.</AlertDescription>
                  </Alert>
                )}
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
                    ? "You have full access to edit and delete this blog post as you are the author."
                    : "You can view this blog post but cannot edit or delete it as you are not the author."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
            <DialogDescription>Update your blog post content and metadata.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-image">Featured Image</Label>
                <Input id="edit-image" type="file" accept="image/*" onChange={handleImageChange} />
                {blog.image_path && <p className="text-xs text-muted-foreground">Current image: {blog.image_path}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-heading">Heading *</Label>
                <Input
                  id="edit-heading"
                  placeholder="Enter blog heading..."
                  value={formData.heading}
                  onChange={(e) => handleInputChange("heading", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-short_description">Short Description *</Label>
                <Textarea
                  id="edit-short_description"
                  placeholder="Enter a brief description..."
                  value={formData.short_description}
                  onChange={(e) => handleInputChange("short_description", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">Content *</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => handleInputChange("content", value)}
                  placeholder="Write your blog content here..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-meta_title">Meta Title</Label>
                  <Input
                    id="edit-meta_title"
                    placeholder="SEO meta title..."
                    value={formData.meta_title}
                    onChange={(e) => handleInputChange("meta_title", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-meta_description">Meta Description</Label>
                  <Textarea
                    id="edit-meta_description"
                    placeholder="SEO meta description..."
                    value={formData.meta_description}
                    onChange={(e) => handleInputChange("meta_description", e.target.value)}
                    rows={2}
                  />
                </div>
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
                  "Update Blog Post"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
