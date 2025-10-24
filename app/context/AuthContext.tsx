'use client'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { auth } from '../../lib/firebase'
import { User, onAuthStateChanged } from 'firebase/auth'

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  getIdToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true, getIdToken: async () => null })

export function useAuth() {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    loading,
    getIdToken: async () => {
      try {
        const u = auth.currentUser
        if (!u) return null
        return await u.getIdToken()
      } catch {
        return null
      }
    }
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
