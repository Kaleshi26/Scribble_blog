import { createContext, useState, useEffect } from 'react'
import axios from 'axios'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUser(res.data))
      .catch(() => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('token')
      })
    }
  }, [token])

  const login = async (email, password) => {
    const res = await axios.post('/api/users/login', { email, password })
    setToken(res.data.token)
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }

  const register = async (username, email, password) => {
    const res = await axios.post('/api/users/register', { username, email, password })
    setToken(res.data.token)
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
