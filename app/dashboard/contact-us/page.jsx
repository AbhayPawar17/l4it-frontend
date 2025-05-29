"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  AlertCircle,
  Eye,
  MoreVertical,
  Building,
  User,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Briefcase,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "../../../contexts/auth-context"

const API_BASE_URL = "http://ai.l4it.net:8000"

export default function ContactUsPage() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { token, user, logout } = useAuth()
  const router = useRouter()

  // Fetch all contact submissions
  const fetchContacts = async () => {
    if (!token) return

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
      setContacts(data.reverse()) // Reverse to show latest contacts first
      setError(null)
    } catch (err) {
      setError(`Failed to fetch contact submissions: ${err.message}`)
      console.error("Error fetching contacts:", err)
    } finally {
      setLoading(false)
    }
  }

  // Refresh contacts
  const refreshContacts = () => {
    fetchContacts()
  }

  // Navigate to contact detail
  const viewContactDetail = (contactId) => {
    router.push(`/dashboard/contact-us/${contactId}`)
  }

  // Get statistics
  const getStatistics = () => {
    const totalContacts = contacts.length
    const thisWeekContacts = contacts.filter((c) => {
      if (!c.submission_date) return false
      const contactDate = new Date(c.submission_date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return contactDate >= weekAgo
    }).length

    const uniqueCompanies = new Set(contacts.filter((c) => c.company_name).map((c) => c.company_name)).size

    const sourceCounts = contacts.reduce((acc, contact) => {
      const source = contact.referral_source || "Unknown"
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {})

    const topSource = Object.keys(sourceCounts).reduce((a, b) => (sourceCounts[a] > sourceCounts[b] ? a : b), "N/A")

    return {
      totalContacts,
      thisWeekContacts,
      uniqueCompanies,
      topSource,
    }
  }

  useEffect(() => {
    if (token) {
      fetchContacts()
    }
  }, [token])

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
        <span className="ml-2">Loading contact submissions...</span>
      </div>
    )
  }

  const stats = getStatistics()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
          <p className="text-muted-foreground">View customer inquiries and contact submissions.</p>
        </div>
        <Button onClick={refreshContacts} variant="outline">
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">Customer inquiries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeekContacts}</div>
            <p className="text-xs text-muted-foreground">New inquiries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueCompanies}</div>
            <p className="text-xs text-muted-foreground">Unique companies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Source</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topSource}</div>
            <p className="text-xs text-muted-foreground">Most common source</p>
          </CardContent>
        </Card>
      </div>

      {/* Contacts Grid */}
      {contacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No contact submissions found</h3>
              <p className="text-muted-foreground">No customer inquiries have been received yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
            <Card
              key={contact.id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-primary/20 hover:border-l-primary"
              onClick={() => viewContactDetail(contact.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      {contact.company_name || "No Company Name"}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      {contact.first_name} {contact.last_name}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {contact.num_employees || "N/A"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            viewContactDetail(contact.id)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{contact.business_email}</span>
                  </div>
                  {contact.phone_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{contact.phone_number}</span>
                    </div>
                  )}
                  {contact.services_needed && (
                    <div className="flex items-start gap-2 text-sm">
                      <Briefcase className="h-3 w-3 text-muted-foreground mt-0.5" />
                      <span className="line-clamp-2">{contact.services_needed}</span>
                    </div>
                  )}
                  {contact.message && (
                    <div className="flex items-start gap-2 text-sm">
                      <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5" />
                      <span className="line-clamp-3 text-muted-foreground">{contact.message}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {contact.submission_date ? new Date(contact.submission_date).toLocaleDateString() : "No date"}
                    </div>
                    {contact.referral_source && (
                      <Badge variant="secondary" className="text-xs">
                        {contact.referral_source}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
