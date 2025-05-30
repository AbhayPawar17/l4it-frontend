"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  MessageSquare,
  Briefcase,
  Users,
  Globe,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "../../../../contexts/auth-context"

const API_BASE_URL = "http://ai.l4it.net:8000"

export default function ContactDetailPage() {
  const [contact, setContact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { token, user, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const contactId = params.id

  // Fetch contact details
  const fetchContact = async () => {

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/contact/submissions`, {
        method: "GET",
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
      const reversedData = data.reverse() // Reverse to show latest contacts first
      const foundContact = reversedData.find((c) => c.id === Number.parseInt(contactId))

      if (!foundContact) {
        setError("Contact not found")
        return
      }

      setContact(foundContact)
      setError(null)
    } catch (err) {
      setError(`Failed to fetch contact: ${err.message}`)
      console.error("Error fetching contact:", err)
    } finally {
      setLoading(false)
    }
  }

  // Refresh contact data
  const refreshContact = () => {
    fetchContact()
  }

  useEffect(() => {
    if (token && contactId) {
      fetchContact()
    }
  }, [token, contactId])

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
        <span className="ml-2">Loading contact...</span>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Contact not found</h3>
              <p className="text-muted-foreground">The contact you're looking for doesn't exist or has been deleted.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            <h1 className="text-3xl font-bold tracking-tight">{contact.company_name || "No Company Name"}</h1>
            <p className="text-muted-foreground">
              Contact from {contact.first_name} {contact.last_name}
            </p>
          </div>
        </div>
        <Button onClick={refreshContact} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Contact Details */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Company Information */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Company Name</div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">{contact.company_name || "Not provided"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Number of Employees</div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p>{contact.num_employees || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Person */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Contact Person
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">First Name</div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">{contact.first_name || "Not provided"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Last Name</div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">{contact.last_name || "Not provided"}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Business Email</div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="break-all">{contact.business_email || "Not provided"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Phone Number</div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p>{contact.phone_number || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services & Message */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                Inquiry Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Services Needed</div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p>{contact.services_needed || "Not specified"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Message</div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="leading-relaxed whitespace-pre-wrap">{contact.message || "No message provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Contact Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">Contact ID:</span> {contact.id}
              </div>
              {contact.submission_date && (
                <div>
                  <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Submitted:</span> {new Date(contact.submission_date).toLocaleString()}
                  </span>
                </div>
              )}
              {contact.updated_at && (
                <div>
                  <Calendar className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Last Updated:</span> {new Date(contact.updated_at).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Source Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Source Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Referral Source</div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">{contact.referral_source || "Not specified"}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">Message Length:</span> {contact.message?.length || 0} characters
              </div>
              <div>
                <span className="font-medium">Word Count:</span>{" "}
                {contact.message
                  ? contact.message
                      .trim()
                      .split(/\s+/)
                      .filter((word) => word.length > 0).length
                  : 0}{" "}
                words
              </div>
              <div>
                <span className="font-medium">Services Listed:</span>{" "}
                {contact.services_needed ? contact.services_needed.split(",").length : 0}
              </div>
            </CardContent>
          </Card>

          {/* Contact Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <Badge variant="outline" className="text-sm">
                  Read Only
                </Badge>
                <p className="text-sm text-muted-foreground">
                  This contact information is displayed for viewing purposes only. No modifications can be made.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
