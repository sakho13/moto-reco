'use client'

import { onAuthStateChanged, type User } from 'firebase/auth'
import { createContext, useEffect, useState, type ReactNode } from 'react'

import * as authService from '../firebase/auth'
import { getFirebaseAuth } from '../firebase/config'

import type { AuthContextType } from '@/types/auth'

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const auth = getFirebaseAuth()

    // 認証状態の監視
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleSignInWithEmail = async (email: string, password: string) => {
    await authService.signInWithEmail(email, password)
  }

  const handleRegisterWithEmail = async (email: string, password: string) => {
    await authService.registerWithEmail(email, password)
  }

  const handleSignInWithGoogle = async () => {
    await authService.signInWithGoogle()
  }

  const handleSignOut = async () => {
    await authService.signOut()
  }

  const handleGetIdToken = async (): Promise<string | null> => {
    if (!user) return null
    return await authService.getIdToken(user)
  }

  const value: AuthContextType = {
    user,
    loading,
    signInWithEmail: handleSignInWithEmail,
    registerWithEmail: handleRegisterWithEmail,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
    getIdToken: handleGetIdToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
