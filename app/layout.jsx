import "./globals.css"
import { AuthProvider } from "../contexts/auth-context"

export const metadata = {
  title: "Dashboard App",
  description: "A modern dashboard application",
    generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
