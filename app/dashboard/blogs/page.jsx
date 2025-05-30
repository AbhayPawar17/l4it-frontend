"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Loader2, AlertCircle, CheckCircle, Eye, Calendar, Edit, Trash2, MoreVertical } from "lucide-react"
import { useAuth } from "../../../contexts/auth-context"

const API_BASE_URL = "http://ai.l4it.net:8000"

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

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState(null)
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

  const fetchBlogs = useCallback(async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/blog/?skip=0&limit=100`, {
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
      setBlogs(data.reverse()) // Reverse to show latest posts first
      setError(null)
    } catch (err) {
      setError(`Failed to fetch blogs: ${err.message}`)
      console.error("Error fetching blogs:", err)
    } finally {
      setLoading(false)
    }
  }, [token, logout, router])

  // Optimized create function
  const createBlog = useCallback(
    async (blogData) => {
      if (!token) return

      try {
        setSubmitting(true)
        const formData = new FormData()

        Object.keys(blogData).forEach((key) => {
          if (key === "image" && blogData[key]) {
            formData.append(key, blogData[key])
          } else if (key !== "image") {
            formData.append(key, blogData[key])
          }
        })

        const response = await fetch(`${API_BASE_URL}/blog/`, {
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

        const newBlog = await response.json()
        setBlogs((prev) => [newBlog, ...prev]) // Add to beginning for latest first
        setSuccess("Blog created successfully!")
        setIsCreateDialogOpen(false)
        resetForm()
      } catch (err) {
        setError(`Failed to create blog: ${err.message}`)
      } finally {
        setSubmitting(false)
      }
    },
    [token, logout, router],
  )

  // Optimized update function
  const updateBlog = useCallback(
    async (blogId, blogData) => {
      if (!token) return

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
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        const updatedBlog = await response.json()
        setBlogs((prev) => prev.map((blog) => (blog.id === blogId ? updatedBlog : blog)))
        setSuccess("Blog updated successfully!")
        setIsEditDialogOpen(false)
        setEditingBlog(null)
        resetForm()
      } catch (err) {
        setError(`Failed to update blog: ${err.message}`)
      } finally {
        setSubmitting(false)
      }
    },
    [token, logout, router],
  )

  // Optimized delete function
  const deleteBlog = useCallback(
    async (blogId) => {
      if (!token) return

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

        setBlogs((prev) => prev.filter((blog) => blog.id !== blogId))
        setSuccess("Blog deleted successfully!")
      } catch (err) {
        setError(`Failed to delete blog: ${err.message}`)
      }
    },
    [token, logout, router],
  )

  // Handle create form submission
  const handleCreateSubmit = useCallback(
    (e) => {
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

      createBlog(formData)
    },
    [formData, createBlog],
  )

  // Handle edit form submission
  const handleEditSubmit = useCallback(
    (e) => {
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

      if (!editingBlog) return

      updateBlog(editingBlog.id, formData)
    },
    [formData, editingBlog, updateBlog],
  )

  // Handle file input change
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0]
    setFormData((prev) => ({ ...prev, image: file }))
  }, [])

  // Handle input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      image: null,
      heading: "",
      short_description: "",
      content: "",
      meta_title: "",
      meta_description: "",
    })
    setError(null)
    setSuccess(null)
  }, [])

  // Open edit dialog
  const openEditDialog = useCallback(
    (blog) => {
      if (blog.user_id !== user?.id) {
        setError("You don't have permission to edit this blog post.")
        return
      }
      setEditingBlog(blog)
      setFormData({
        image: null,
        heading: blog.heading || "",
        short_description: blog.short_description || "",
        content: blog.content || "",
        meta_title: blog.meta_title || "",
        meta_description: blog.meta_description || "",
      })
      setIsEditDialogOpen(true)
    },
    [user?.id],
  )

  // Handle delete click
  const handleDeleteClick = useCallback(
    (blog) => {
      if (blog.user_id !== user?.id) {
        setError("You don't have permission to delete this blog post.")
        return
      }
      deleteBlog(blog.id)
    },
    [user?.id, deleteBlog],
  )

  // Navigate to blog detail using client-side navigation
  const viewBlogDetail = useCallback(
    (blogId) => {
      router.push(`/dashboard/blogs/${blogId}`)
    },
    [router],
  )

  // Check if user owns the blog - memoized
  const isOwner = useCallback((blog) => blog.user_id === user?.id, [user?.id])

  // Memoized blog cards to prevent unnecessary re-renders
  const blogCards = useMemo(() => {
    return blogs.map((blog) => (
      <Card key={blog.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg line-clamp-2">{blog.heading}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Published</Badge>
              {isOwner(blog) && <Badge variant="secondary">Owner</Badge>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => viewBlogDetail(blog.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Read More
                  </DropdownMenuItem>
                  {isOwner(blog) && (
                    <>
                      <DropdownMenuItem onClick={() => openEditDialog(blog)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(blog)}
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
            {blog.image_path && (
              <div className="aspect-video relative overflow-hidden rounded-md bg-muted">
                <img
                  src={getImageUrl(blog.image_path) || "/placeholder.svg"}
                  alt={blog.heading}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.target.style.display = "none"
                  }}
                />
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {blog.short_description || "No description available"}
              </p>
            </div>
            {blog.created_at && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="mr-1 h-3 w-3" />
                {new Date(blog.created_at).toLocaleDateString()}
              </div>
            )}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => viewBlogDetail(blog.id)}>
                <Eye className="mr-2 h-3 w-3" />
                Read More
              </Button>
              {isOwner(blog) && (
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(blog)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(blog)}
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
    ))
  }, [blogs, isOwner, viewBlogDetail, openEditDialog, handleDeleteClick])

  useEffect(() => {
    if (token) {
      fetchBlogs()
    }
  }, [token, fetchBlogs])

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
        <span className="ml-2">Loading blogs...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blogs</h1>
          <p className="text-muted-foreground">Manage your blog posts and articles.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Blog Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Blog Post</DialogTitle>
              <DialogDescription>Create a new blog post with rich content and SEO metadata.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Featured Image</Label>
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heading">Heading *</Label>
                  <Input
                    id="heading"
                    placeholder="Enter blog heading..."
                    value={formData.heading}
                    onChange={(e) => handleInputChange("heading", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description *</Label>
                  <Textarea
                    id="short_description"
                    placeholder="Enter a brief description..."
                    value={formData.short_description}
                    onChange={(e) => handleInputChange("short_description", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <FroalaTextEditor
                    value={formData.content}
                    onChange={(value) => handleInputChange("content", value)}
                    placeholder="Write your blog content here..."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                      id="meta_title"
                      placeholder="SEO meta title..."
                      value={formData.meta_title}
                      onChange={(e) => handleInputChange("meta_title", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      placeholder="SEO meta description..."
                      value={formData.meta_description}
                      onChange={(e) => handleInputChange("meta_description", e.target.value)}
                      rows={2}
                    />
                  </div>
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
                    "Create Blog Post"
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

      {/* Blogs Grid */}
      {blogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No blog posts found</h3>
              <p className="text-muted-foreground">Get started by creating your first blog post.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Blog Post
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{blogCards}</div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
            <DialogDescription>Update your blog post content and metadata.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-image">Featured Image</Label>
                <Input id="edit-image" type="file" accept="image/*" onChange={handleImageChange} />
                {editingBlog?.image_path && (
                  <p className="text-xs text-muted-foreground">Current image: {editingBlog.image_path}</p>
                )}
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
                <FroalaTextEditor
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
