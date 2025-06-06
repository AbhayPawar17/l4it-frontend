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
  const isOwner = blog && user && blog.author_email === user.email

  // Function to get proper image URL - IMPROVED VERSION
  const getImageUrl = useCallback((image) => {
    console.log("getImageUrl called with:", image)
    
    // Return placeholder immediately if no image
    if (!image || image === undefined || image === null || image === '') {
      return "/placeholder.svg?height=800&width=1600"
    }
    
    if (typeof image === 'string' && (image.startsWith("http://") || image.startsWith("https://"))) {
      return image
    }
    
    // Handle the specific format from your API: "/static/uploads/blog3.jpeg"
    if (typeof image === 'string' && image.startsWith("/static/")) {
      return `${API_BASE_URL}${image}`
    }
    
    // Handle format without leading slash: "static/uploads/blog3.jpeg"
    if (typeof image === 'string' && image.startsWith("static/")) {
      return `${API_BASE_URL}/${image}`
    }
    
    if (typeof image === 'string') {
      return `${API_BASE_URL}/static/uploads/${image}`
    }
    
    // Fallback to placeholder
    return "/placeholder.svg?height=800&width=1600"
  }, [])

  // Fetch blog details
  const fetchBlog = useCallback(async () => {
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
      console.log("Fetched blog data:", data)
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
  }, [token, blogId, logout, router])

  // Update blog - IMPROVED VERSION with better error handling
  const updateBlog = useCallback(
    async (blogData, image) => {
      if (!token || !isOwner) {
        setError("You don't have permission to edit this blog post.")
        return
      }

      try {
        setSubmitting(true)
        const formDataToSend = new FormData()
        
        // Append all blog data fields
        formDataToSend.append("heading", blogData.heading)
        formDataToSend.append("short_description", blogData.short_description)
        formDataToSend.append("content", blogData.content)
        formDataToSend.append("meta_title", blogData.meta_title)
        formDataToSend.append("meta_description", blogData.meta_description)
        
        // Append image if provided
        if (image) {
          formDataToSend.append("image", image)
        }

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
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        const updatedBlog = await response.json()
        setBlog(updatedBlog)
        setSuccess("Blog updated successfully!")
        setIsEditDialogOpen(false)
        setImageError(false)
        
        // Reset the image error state when blog is updated
        setImageError(false)
      } catch (err) {
        setError(`Failed to update blog: ${err.message}`)
      } finally {
        setSubmitting(false)
      }
    },
    [token, isOwner, blogId, logout, router],
  )

  // Delete blog - IMPROVED VERSION with better error handling
  const deleteBlog = useCallback(async () => {
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      setSuccess("Blog deleted successfully!")
      setTimeout(() => {
        router.push("/dashboard/blogs")
      }, 1500)
    } catch (err) {
      setError(`Failed to delete blog: ${err.message}`)
    }
  }, [token, isOwner, blogId, logout, router])

  // Handle form submission - IMPROVED VERSION
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

      updateBlog({ heading, short_description, content, meta_title, meta_description }, image)
    },
    [formData, updateBlog],
  )

  // Handle form data changes - IMPROVED VERSION
  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Handle file input change
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0]
    setFormData((prev) => ({ ...prev, image: file }))
  }, [])

  // Open edit dialog - IMPROVED VERSION
  const openEditDialog = useCallback(() => {
    if (!isOwner) {
      setError("You don't have permission to edit this blog post.")
      return
    }
    // Reset form data with current blog data when opening dialog
    setFormData({
      image: null,
      heading: blog.heading || "",
      short_description: blog.short_description || "",
      content: blog.content || "",
      meta_title: blog.meta_title || "",
      meta_description: blog.meta_description || "",
    })
    setIsEditDialogOpen(true)
  }, [isOwner, blog])

  // Handle image error - IMPROVED VERSION
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
    if (token && blogId) {
      fetchBlog()
    }
  }, [token, blogId, fetchBlog])

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
        <Button variant="outline" onClick={goBack}>
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

  const readingTime = estimateReadingTime(blog.content)
  const contentLength = countCharacters(blog.content)
  const wordCount = countWords(blog.content)
  const metaTitleLength = countCharacters(blog.meta_title)
  const metaDescriptionLength = countCharacters(blog.meta_description)
  
  // Get the correct image field - check both possible field names
  const blogImagePath = blog.image_path || blog.image || null
  const imageUrl = getImageUrl(blogImagePath)

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
              {/* Featured Image Section - IMPROVED VERSION */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Featured Image</h3>
                <div className="aspect-video relative overflow-hidden rounded-lg bg-muted border-2 border-dashed border-muted-foreground/25">
                  {blogImagePath && !imageError ? (
                    <img
                      src={imageUrl}
                      alt={blog.heading || "Blog featured image"}
                      className="object-cover w-full h-full"
                      onError={handleImageError}
                      onLoad={() => setImageError(false)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-16 w-16 mb-4" />
                      <p className="text-lg font-medium">
                        {blogImagePath ? "Image failed to load" : "No featured image"}
                      </p>
                      {blogImagePath && (
                        <>
                          <p className="text-sm text-center px-4 mt-2">Path: {blogImagePath}</p>
                          <p className="text-xs text-center px-4 mt-1 text-red-500">URL: {imageUrl}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Blog Content</h3>
                <div className="prose max-w-none overflow-hidden">
                  <div
                    dangerouslySetInnerHTML={{ __html: blog.content || "No content available" }}
                    className="leading-relaxed break-words overflow-wrap-anywhere hyphens-auto"
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
              <CardTitle className="text-lg">SEO Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">Meta Title:</span> {blog.meta_title || "N/A"}
              </div>
              <div>
                <span className="font-medium">Meta Description:</span> {blog.meta_description || "N/A"}               </div>
                   
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Author Name:</span> {blog?.author_email?.split('@')[0]}
                  {isOwner && <span className="ml-2 text-green-600">(You)</span>}
                </span>
              </div>
              <div>
                <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                <span className="font-medium">Created On:</span> {new Date(blog?.created_at).toLocaleDateString() || "N/A"}
              </div>
              <div>
                <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                <span className="font-medium">Updated On:</span> {new Date(blog?.updated_at).toLocaleDateString() || "N/A"}               </div>
                   
            </CardContent>
          </Card>

        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
            <DialogDescription>Update your blog post content and metadata.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-3">
              <div className="space-y-2">
                <Label htmlFor="edit-heading">Heading *</Label>
                <Input
                  id="edit-heading"
                  placeholder="Enter blog heading..."
                  value={formData.heading}
                  onChange={(e) => handleFormChange("heading", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-short_description">Short Description *</Label>
                <Textarea
                  id="edit-short_description"
                  placeholder="Enter a brief description..."
                  value={formData.short_description}
                  onChange={(e) => handleFormChange("short_description", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">Content *</Label>
                <FroalaTextEditor
                  value={formData.content}
                  onChange={(value) => handleFormChange("content", value)}
                  placeholder="Write your blog content here..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-meta_title">Meta Title</Label>
                <Input
                  id="edit-meta_title"
                  placeholder="SEO meta title..."
                  value={formData.meta_title}
                  onChange={(e) => handleFormChange("meta_title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-meta_description">Meta Description</Label>
                <Textarea
                  id="edit-meta_description"
                  placeholder="SEO meta description..."
                  value={formData.meta_description}
                  onChange={(e) => handleFormChange("meta_description", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-image">Featured Image (optional)</Label>
                <Input id="edit-image" type="file" accept="image/*" onChange={handleImageChange} />
                {blogImagePath && <p className="text-xs text-muted-foreground">Current image: {blogImagePath}</p>}
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