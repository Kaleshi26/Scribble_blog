// SocketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../hooks/useAuth'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, token } = useAuth()

  useEffect(() => {
    if (user && token) {
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token
        }
      })

      newSocket.on('connect', () => {
        console.log('Connected to server')
        setIsConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server')
        setIsConnected(false)
      })

      newSocket.on('authenticated', (data) => {
        console.log('Socket authenticated:', data)
      })

      newSocket.on('auth_error', (error) => {
        console.error('Socket auth error:', error)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    } else {
      if (socket) {
        socket.close()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [user, token])

  const joinPostRoom = (postId) => {
    if (socket) {
      socket.emit('join_post_room', postId)
    }
  }

  const leavePostRoom = (postId) => {
    if (socket) {
      socket.emit('leave_post_room', postId)
    }
  }

  const joinUserRoom = (userId) => {
    if (socket) {
      socket.emit('join_user_room', userId)
    }
  }

  const sendComment = (postId, comment) => {
    if (socket) {
      socket.emit('new_comment', { postId, comment })
    }
  }

  const updateComment = (postId, comment) => {
    if (socket) {
      socket.emit('comment_updated', { postId, comment })
    }
  }

  const deleteComment = (postId, commentId) => {
    if (socket) {
      socket.emit('comment_deleted', { postId, commentId })
    }
  }

  const sendPostLike = (postId, isLiked, likesCount) => {
    if (socket) {
      socket.emit('post_liked', { postId, isLiked, likesCount })
    }
  }

  const startTyping = (postId) => {
    if (socket && user) {
      socket.emit('typing_start', { postId, user: { username: user.username, avatar: user.avatar } })
    }
  }

  const stopTyping = (postId) => {
    if (socket && user) {
      socket.emit('typing_stop', { postId, user: { username: user.username, avatar: user.avatar } })
    }
  }

  const value = {
    socket,
    isConnected,
    joinPostRoom,
    leavePostRoom,
    joinUserRoom,
    sendComment,
    updateComment,
    deleteComment,
    sendPostLike,
    startTyping,
    stopTyping
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
