import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Send, Edit, Trash2, Users, Mail, TrendingUp } from "lucide-react"

export default function NewsletterPage() {
  const newsletters = [
    {
      id: 1,
      subject: "Monthly Tech Updates - January 2024",
      status: "sent",
      sentDate: "2024-01-15",
      recipients: 1234,
      openRate: "24.5%",
    },
    {
      id: 2,
      subject: "New Service Launch Announcement",
      status: "draft",
      sentDate: null,
      recipients: 0,
      openRate: null,
    },
    {
      id: 3,
      subject: "Year End Review 2023",
      status: "sent",
      sentDate: "2023-12-31",
      recipients: 1156,
      openRate: "31.2%",
    },
  ]

  const stats = [
    {
      title: "Total Subscribers",
      value: "1,234",
      icon: Users,
      change: "+12%",
    },
    {
      title: "Newsletters Sent",
      value: "24",
      icon: Mail,
      change: "+8%",
    },
    {
      title: "Average Open Rate",
      value: "27.8%",
      icon: TrendingUp,
      change: "+3.2%",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Newsletter</h1>
          <p className="text-muted-foreground">Manage your newsletter campaigns and subscribers.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Newsletter
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Newsletters</CardTitle>
          <CardDescription>Your latest newsletter campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {newsletters.map((newsletter) => (
              <div key={newsletter.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-medium">{newsletter.subject}</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <Badge variant={newsletter.status === "sent" ? "default" : "secondary"}>{newsletter.status}</Badge>
                    {newsletter.sentDate && <span>Sent: {newsletter.sentDate}</span>}
                    {newsletter.recipients > 0 && <span>{newsletter.recipients} recipients</span>}
                    {newsletter.openRate && <span>Open rate: {newsletter.openRate}</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {newsletter.status === "draft" ? (
                    <Button size="sm">
                      <Send className="mr-2 h-3 w-3" />
                      Send
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
