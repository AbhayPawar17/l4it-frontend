"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
      setSections(data)
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
      setSections((prev) => [...prev, newSection])
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

    if (!formData.content.trim()) {
      setError("Content is required")
      return
    }

    createSection(formData)
  }

  // Handle edit form submission
  const handleEditSubmit = (e) => {
    e.preventDefault()

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

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      content: "",
      image: null,
    })
    setError(null)
    setSuccess(null)
  }

  // Open edit dialog
  const openEditDialog = (section) => {
    setEditingSection(section)
    setFormData({
      content: section.content || "",
      image: null,
    })
    setIsEditDialogOpen(true)
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
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
              <DialogDescription>Add a new section to your company information.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-4">
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

      {/* Sections */}
      <div className="grid gap-6">
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
          sections.map((section) => {
            return (
              <Card
                key={section.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => viewSectionDetail(section.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <CardTitle className="text-xl">Section #{section.id}</CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          viewSectionDetail(section.id)
                        }}
                      >
                        <Eye className="mr-2 h-3 w-3" />
                        View Details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditDialog(section)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSection(section.id)
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.image_path && (
                    <div className="aspect-video relative overflow-hidden rounded-lg bg-muted">
                      <img
                        src={getImageUrl(section.image_path) || "/placeholder.svg"}
                        alt={"Section " + section.id}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.target.style.display = "none"
                        }}
                      />
                    </div>
                  )}
                  <p className="text-muted-foreground leading-relaxed line-clamp-3">{section.content}</p>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground flex justify-between items-center">
                  {section.updated_at && <div>Last updated: {new Date(section.updated_at).toLocaleDateString()}</div>}
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>Update section information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content *</Label>
                <FroalaTextEditor
                  id="edit-content"
                  placeholder="Enter section content..."
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-image">Image (optional)</Label>
                <Input id="edit-image" type="file" accept="image/*" onChange={handleImageChange} />
                {editingSection?.image_path && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Current image:</p>
                    <div className="aspect-video w-full max-w-sm relative overflow-hidden rounded-lg bg-muted">
                      <img
                        src={getImageUrl(editingSection.image_path) || "/placeholder.svg"}
                        alt={"Section " + editingSection.id}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.target.parentNode.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <span class="text-sm">Image failed to load</span>
                            <span class="text-xs">${editingSection.image_path}</span>
                          </div>`
                        }}
                      />
                    </div>
                  </div>
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
