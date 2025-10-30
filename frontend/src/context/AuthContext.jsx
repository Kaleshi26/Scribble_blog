// AuthContext.jsx
import { createContext, useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const res = await axios.get('/api/users/profile', {
            headers: { Authorization: `Bearer ${token}` }
          })
          setUser(res.data)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Auth initialization error:', error)
          setUser(null)
          setToken(null)
          setIsAuthenticated(false)
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [token])

  const login = async (email, password, rememberMe = false) => {
    try {
      setLoading(true)
      const res = await axios.post('/api/users/login', { 
        email, 
        password, 
        rememberMe 
      })
      
      setToken(res.data.token)
      localStorage.setItem('token', res.data.token)
      if (res.data.refreshToken) {
        localStorage.setItem('refreshToken', res.data.refreshToken)
      }
      setUser(res.data.user)
      setIsAuthenticated(true)
      
      toast.success('Welcome back!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      const res = await axios.post('/api/users/register', userData)
      
      setToken(res.data.token)
      localStorage.setItem('token', res.data.token)
      if (res.data.refreshToken) {
        localStorage.setItem('refreshToken', res.data.refreshToken)
      }
      setUser(res.data.user)
      setIsAuthenticated(true)
      
      toast.success('Account created successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const googleAuth = async (googleData) => {
    try {
      setLoading(true)
      const res = await axios.post('/api/users/google-auth', googleData)
      
      setToken(res.data.token)
      localStorage.setItem('token', res.data.token)
      setUser(res.data.user)
      setIsAuthenticated(true)
      
      toast.success('Welcome!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Google authentication failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint if needed
      if (token) {
        await axios.post('/api/users/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setToken(null)
      setIsAuthenticated(false)
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      toast.success('Logged out successfully')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put('/api/users/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setUser(res.data)
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const changePassword = async (passwordData) => {
    try {
      await axios.put('/api/users/change-password', passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Password changed successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken')
      if (!refreshTokenValue) return false

      const res = await axios.post('/api/users/refresh-token', {
        refreshToken: refreshTokenValue
      })

      setToken(res.data.token)
      localStorage.setItem('token', res.data.token)
      return true
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      return false
    }
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    googleAuth,
    logout,
    updateProfile,
    changePassword,
    refreshToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
