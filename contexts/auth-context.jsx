"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(undefined)

const API_BASE_URL = "http://ai.l4it.net:8000"

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Check for stored token on mount (client-side only)
    try {
      const storedToken = localStorage.getItem("auth_token")
      const storedUser = localStorage.getItem("user_data")

      if (storedToken) {
        setToken(storedToken)
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          console.error("Error parsing stored user data:", error)
          localStorage.removeItem("user_data")
        }
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }

    setLoading(false)
  }, [mounted])

  // Login function that calls the API
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Login failed: ${response.status}`)
      }

      const data = await response.json()

      // Assuming the API returns { token: "...", user: {...} }
      // Adjust based on your actual API response structure
      const authToken = data.access_token || data.token
      const userData = data.user || { email: email, id: data.user_id }

      if (!authToken) {
        throw new Error("No token received from server")
      }

      setToken(authToken)
      setUser(userData)

      if (mounted) {
        try {
          localStorage.setItem("auth_token", authToken)
          localStorage.setItem("user_data", JSON.stringify(userData))
        } catch (error) {
          console.error("Error saving to localStorage:", error)
        }
      }

      return { success: true, data: { token: authToken, user: userData } }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    if (mounted) {
      try {
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_data")
      } catch (error) {
        console.error("Error removing from localStorage:", error)
      }
    }
  }

  const value = {
    token,
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  }

  // Don't render children until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
