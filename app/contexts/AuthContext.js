'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { validateCredentials, getCredentials } from '../config/auth'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [userRole, setUserRole] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check authentication status on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated')
    const storedUsername = localStorage.getItem('username')
    const storedUserRole = localStorage.getItem('userRole')
    
    if (authStatus === 'true' && storedUsername) {
      setIsAuthenticated(true)
      setUsername(storedUsername)
      setUserRole(storedUserRole || 'user')
    }
    
    setIsLoading(false)
  }, [])

  const login = (username, password) => {
    const result = validateCredentials(username, password)
    
    if (result.success) {
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('username', username)
      localStorage.setItem('userRole', result.user.role)
      setIsAuthenticated(true)
      setUsername(username)
      setUserRole(result.user.role)
      return { success: true }
    } else {
      return { success: false, error: result.error }
    }
  }

  const logout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('username')
    localStorage.removeItem('userRole')
    setIsAuthenticated(false)
    setUsername('')
    setUserRole('')
    router.push('/login')
  }

  const updateCredentials = (oldUsername, oldPassword, newUsername, newPassword) => {
    // Validate old credentials first
    const validation = validateCredentials(oldUsername, oldPassword)
    if (!validation.success) {
      return { success: false, error: 'Current credentials are incorrect' }
    }
    
    // You can implement actual credential storage here
    console.log('Credentials updated:', { oldUsername, oldPassword, newUsername, newPassword })
    
    return { success: true, message: 'Credentials updated successfully' }
  }

  const value = {
    isAuthenticated,
    username,
    userRole,
    isLoading,
    login,
    logout,
    updateCredentials
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
