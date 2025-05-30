"use client"

import { useState, useEffect } from "react"
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
import { Plus, Loader2, AlertCircle, CheckCircle, Eye, Edit, Trash2, MoreVertical } from "lucide-react"
import { useAuth } from "../../../contexts/auth-context"

const API_BASE_URL = "http://ai.l4it.net:8000"

export default function CaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCaseStudy, setEditingCaseStudy] = useState(null)
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

  // Fetch all case studies
  const fetchCaseStudies = async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/case-studies`, {
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
      setCaseStudies(data.reverse())
      setError(null)
    } catch (err) {
      setError(`Failed to fetch case studies: ${err.message}`)
      console.error("Error fetching case studies:", err)
    } finally {
      setLoading(false)
    }
  }

  // Create new case study
  const createCaseStudy = async (caseStudyData, image) => {
    if (!token) return

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

      const response = await fetch(`${API_BASE_URL}/case-studies/`, {
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

      const newCaseStudy = await response.json()
      setCaseStudies((prev) => [...prev, newCaseStudy])
      setSuccess("Case study created successfully!")
      setIsCreateDialogOpen(false)
      setFormData({ 
        heading: "",
        short_description: "",
        content: "", 
        meta_title: "",
        meta_description: "",
        image: null 
      })
    } catch (err) {
      setError(`Failed to create case study: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Update case study
  const updateCaseStudy = async (caseStudyId, caseStudyData, image) => {
    if (!token) return

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
      setCaseStudies((prev) => prev.map((caseStudy) => (caseStudy.id === caseStudyId ? updatedCaseStudy : caseStudy)))
      setSuccess("Case study updated successfully!")
      setIsEditDialogOpen(false)
      setEditingCaseStudy(null)
      setFormData({ 
        heading: "",
        short_description: "",
        content: "", 
        meta_title: "",
        meta_description: "",
        image: null 
      })
    } catch (err) {
      setError(`Failed to update case study: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete case study
  const deleteCaseStudy = async (caseStudyId) => {
    if (!token) return

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

      setCaseStudies((prev) => prev.filter((caseStudy) => caseStudy.id !== caseStudyId))
      setSuccess("Case study deleted successfully!")
    } catch (err) {
      setError(`Failed to delete case study: ${err.message}`)
    }
  }

  // Handle create form submission
  const handleCreateSubmit = (e) => {
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

    createCaseStudy({ heading, short_description, content, meta_title, meta_description }, image)
  }

  // Handle edit form submission
  const handleEditSubmit = (e) => {
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

    if (!editingCaseStudy) return

    updateCaseStudy(editingCaseStudy.id, { heading, short_description, content, meta_title, meta_description }, image)
  }

  // Handle form data changes
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle file input change
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setFormData((prev) => ({ ...prev, image: file }))
  }

  // Reset form and close dialogs
  const resetForm = () => {
    setFormData({ 
      heading: "",
      short_description: "",
      content: "", 
      meta_title: "",
      meta_description: "",
      image: null 
    })
    setError(null)
    setSuccess(null)
  }

  // Open edit dialog
  const openEditDialog = (caseStudy) => {
    if (caseStudy.user_id !== user?.id) {
      setError("You don't have permission to edit this case study.")
      return
    }
    setEditingCaseStudy(caseStudy)
    setFormData({ 
      heading: caseStudy.heading || "",
      short_description: caseStudy.short_description || "",
      content: caseStudy.content || "", 
      meta_title: caseStudy.meta_title || "",
      meta_description: caseStudy.meta_description || "",
      image: null 
    })
    setIsEditDialogOpen(true)
  }

  // Handle delete click
  const handleDeleteClick = (caseStudy) => {
    if (caseStudy.user_id !== user?.id) {
      setError("You don't have permission to delete this case study.")
      return
    }
    deleteCaseStudy(caseStudy.id)
  }

  // Navigate to case study detail
  const viewCaseStudyDetail = (caseStudyId) => {
    router.push(`/dashboard/case-studies/${caseStudyId}`)
  }

  // Check if user owns the case study
  const isOwner = (caseStudy) => caseStudy.user_id === user?.id

  useEffect(() => {
    if (token) {
      fetchCaseStudies()
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
        <span className="ml-2">Loading case studies...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Case Studies</h1>
          <p className="text-muted-foreground">Manage your case studies and success stories.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Case Study
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Case Study</DialogTitle>
              <DialogDescription>
                Add a new case study to showcase your work. Fill in all required fields.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-3">
                <div className="space-y-2">
                  <Label htmlFor="heading">Heading *</Label>
                  <Input
                    id="heading"
                    value={formData.heading}
                    onChange={(e) => handleFormChange("heading", e.target.value)}
                    placeholder="Enter case study heading..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description *</Label>
                  <Textarea
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => handleFormChange("short_description", e.target.value)}
                    placeholder="Enter a brief description..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <FroalaTextEditor
                    value={formData.content}
                    onChange={(value) => handleFormChange("content", value)}
                    placeholder="Write your case study content here..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => handleFormChange("meta_title", e.target.value)}
                    placeholder="SEO meta title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => handleFormChange("meta_description", e.target.value)}
                    placeholder="SEO meta description..."
                    rows={2}
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
                    "Create Case Study"
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

      {/* Case Studies Grid */}
      {caseStudies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No case studies found</h3>
              <p className="text-muted-foreground">Get started by creating your first case study.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Case Study
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {caseStudies.map((caseStudy) => (
            <Card key={caseStudy.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg line-clamp-1">{caseStudy.heading}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">Active</Badge>
                    {isOwner(caseStudy) && <Badge variant="secondary">Owner</Badge>}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewCaseStudyDetail(caseStudy.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {isOwner(caseStudy) && (
                          <>
                            <DropdownMenuItem onClick={() => openEditDialog(caseStudy)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(caseStudy)}
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
                  {caseStudy.image && (
                    <div className="aspect-video relative overflow-hidden rounded-md bg-muted">
                      <img
                        src={getImageUrl(caseStudy.image) || "/placeholder.svg"}
                        alt="Case study image"
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.target.style.display = "none"
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {caseStudy.short_description || "No description available"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => viewCaseStudyDetail(caseStudy.id)}>
                      <Eye className="mr-2 h-3 w-3" />
                      View Details
                    </Button>
                    {isOwner(caseStudy) && (
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(caseStudy)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(caseStudy)}
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
            <DialogTitle>Edit Case Study</DialogTitle>
            <DialogDescription>Update the case study information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
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
                {editingCaseStudy?.image && (
                  <p className="text-xs text-muted-foreground">Current image: {editingCaseStudy.image}</p>
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