import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Briefcase, Users, Mail } from "lucide-react"

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Blogs",
      value: "24",
      description: "Published articles",
      icon: BookOpen,
    },
    {
      title: "Services",
      value: "8",
      description: "Active services",
      icon: Briefcase,
    },
    {
      title: "Team Members",
      value: "12",
      description: "Active members",
      icon: Users,
    },
    {
      title: "Newsletter Subscribers",
      value: "1,234",
      description: "Total subscribers",
      icon: Mail,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard. Here's an overview of your content.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across your platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New blog post published</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Service updated</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Newsletter sent</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="/dashboard/blogs" className="block p-2 rounded hover:bg-muted transition-colors">
                <p className="text-sm font-medium">Create New Blog Post</p>
                <p className="text-xs text-muted-foreground">Write and publish a new article</p>
              </a>
              <a href="/dashboard/services" className="block p-2 rounded hover:bg-muted transition-colors">
                <p className="text-sm font-medium">Add New Service</p>
                <p className="text-xs text-muted-foreground">Create a new service offering</p>
              </a>
              <a href="/dashboard/newsletter" className="block p-2 rounded hover:bg-muted transition-colors">
                <p className="text-sm font-medium">Send Newsletter</p>
                <p className="text-xs text-muted-foreground">Create and send newsletter</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
