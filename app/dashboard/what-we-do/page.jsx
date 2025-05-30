"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Trash2, Loader2, AlertCircle, CheckCircle, MoreVertical, Eye } from "lucide-react"
import { useAuth } from "../../../contexts/auth-context"
import { FroalaTextEditor } from "@/components/rich-text-editor"

const API_BASE_URL = "http://ai.l4it.net:8000"

export default function WhatWeDoPage() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    image: null,
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

  // Fetch all sections
  const fetchSections = async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/info/`, {
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
      setSections(data.reverse())
      setError(null)
    } catch (err) {
      setError(`Failed to fetch sections: ${err.message}`)
      console.error("Error fetching sections:", err)
    } finally {
      setLoading(false)
    }
  }

  // Create new section
  const createSection = async (sectionData) => {
    if (!token) return

    try {
      setSubmitting(true)
      const formData = new FormData()

      Object.keys(sectionData).forEach((key) => {
        if (key === "image" && sectionData[key]) {
          formData.append(key, sectionData[key])
        } else if (key !== "image") {
          formData.append(key, sectionData[key])
        }
      })

      const response = await fetch(`${API_BASE_URL}/info/`, {
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

      const newSection = await response.json()
      setSections((prev) => [newSection, ...prev])
      setSuccess("Section created successfully!")
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (err) {
      setError(`Failed to create section: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Update section
  const updateSection = async (sectionId, sectionData) => {
    if (!token) return

    try {
      setSubmitting(true)
      const formDataToSend = new FormData()

      Object.keys(sectionData).forEach((key) => {
        if (key === "image" && sectionData[key]) {
          formDataToSend.append(key, sectionData[key])
        } else if (key !== "image") {
          formDataToSend.append(key, sectionData[key])
        }
      })

      const response = await fetch(`${API_BASE_URL}/info/${sectionId}`, {
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
          setError("You don't have permission to edit this section.")
          return
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const updatedSection = await response.json()
      setSections((prev) => prev.map((section) => (section.id === sectionId ? updatedSection : section)))
      setSuccess("Section updated successfully!")
      setIsEditDialogOpen(false)
      setEditingSection(null)
      resetForm()
    } catch (err) {
      setError(`Failed to update section: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete section
  const deleteSection = async (sectionId) => {
    if (!token) return

    if (!confirm("Are you sure you want to delete this section? This action cannot be undone.")) return

    try {
      const response = await fetch(`${API_BASE_URL}/info/${sectionId}`, {
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
          setError("You don't have permission to delete this section.")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setSections((prev) => prev.filter((section) => section.id !== sectionId))
      setSuccess("Section deleted successfully!")
    } catch (err) {
      setError(`Failed to delete section: ${err.message}`)
    }
  }

  // Handle create form submission
  const handleCreateSubmit = (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError("Name is required")
      return
    }

    if (!formData.content.trim()) {
      setError("Content is required")
      return
    }

    createSection(formData)
  }

  // Handle edit form submission
  const handleEditSubmit = (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError("Name is required")
      return
    }

    if (!formData.content.trim()) {
      setError("Content is required")
      return
    }

    if (!editingSection) return

    updateSection(editingSection.id, formData)
  }

  // Handle file input change
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setFormData((prev) => ({ ...prev, image: file }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      content: "",
      image: null,
    })
    setError(null)
    setSuccess(null)
  }

  // Open edit dialog
  const openEditDialog = (section) => {
    if (section.user_id !== user?.id) {
      setError("You don't have permission to edit this section.")
      return
    }
    setEditingSection(section)
    setFormData({
      name: section.name || "",
      content: section.content || "",
      image: null,
    })
    setIsEditDialogOpen(true)
  }

  // Handle delete click
  const handleDeleteClick = (section) => {
    if (section.user_id !== user?.id) {
      setError("You don't have permission to delete this section.")
      return
    }
    deleteSection(section.id)
  }

  // Navigate to section detail
  const viewSectionDetail = (sectionId) => {
    router.push(`/dashboard/what-we-do/${sectionId}`)
  }

  // Check if user owns the section
  const isOwner = (section) => section.user_id === user?.id

  useEffect(() => {
    if (token) {
      fetchSections()
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
        <span className="ml-2">Loading sections...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">What We Do</h1>
          <p className="text-muted-foreground">Manage your company information and values.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
              <DialogDescription>Add a new section to your company information.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    placeholder="Enter section name..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <FroalaTextEditor
                    value={formData.content}
                    onChange={(content) => setFormData(prev => ({...prev, content}))}
                    placeholder="Enter section content..."
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
                    "Create Section"
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

      {/* Sections Grid */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No sections found</h3>
              <p className="text-muted-foreground">Get started by creating your first section.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Card key={section.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {section.name || `Section #${section.id}`}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">Active</Badge>
                    {isOwner(section) && <Badge variant="secondary">Owner</Badge>}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewSectionDetail(section.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {isOwner(section) && (
                          <>
                            <DropdownMenuItem onClick={() => openEditDialog(section)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(section)}
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
                {section.name && (
                  <p className="text-sm text-muted-foreground font-medium">
                    {section.name}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.image_path && (
                    <div className="aspect-video relative overflow-hidden rounded-md bg-muted">
                      <img
                        src={getImageUrl(section.image_path) || "/placeholder.svg"}
                        alt="Section image"
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
                          section.content?.substring(0, 150) + (section.content?.length > 150 ? "..." : "") ||
                          "No content available",
                      }}
                      className="text-sm text-muted-foreground line-clamp-3"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => viewSectionDetail(section.id)}>
                      <Eye className="mr-2 h-3 w-3" />
                      View Details
                    </Button>
                    {isOwner(section) && (
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(section)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(section)}
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
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>Update section information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-3">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  placeholder="Enter section name..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content *</Label>
                <FroalaTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData(prev => ({...prev, content}))}
                  placeholder="Enter section content..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image">Image (optional)</Label>
                <Input id="edit-image" type="file" accept="image/*" onChange={handleImageChange} />
                {editingSection?.image_path && (
                  <p className="text-xs text-muted-foreground">Current image: {editingSection.image_path}</p>
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