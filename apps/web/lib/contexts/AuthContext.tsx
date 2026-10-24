'use client'

import { onIdTokenChanged, type User } from 'firebase/auth'
import { createContext, useEffect, useState, type ReactNode } from 'react'
import * as authService from '../firebase/auth'
import { getFirebaseAuth } from '../firebase/config'
import type { AuthContextType } from '@/types/auth'

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  /** reload() で同一参照の User が更新された際に再描画させるためのカウンタ */
  const [, setProviderVersion] = useState(0)

  useEffect(() => {
    const auth = getFirebaseAuth()

    // 認証状態の監視
    const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleSignInWithEmail = async (email: string, password: string) => {
    const result = await authService.signInWithEmail(email, password)
    return result.user.getIdToken()
  }

  const handleRegisterWithEmail = async (email: string, password: string) => {
    const result = await authService.registerWithEmail(email, password)
    return result.user.getIdToken()
  }

  const handleRequestPasswordReset = async (email: string) => {
    await authService.requestPasswordReset(email)
  }

  const handleSignInWithGoogle = async () => {
    const result = await authService.signInWithGoogle()
    return result.user.getIdToken()
  }

  const handleLinkWithGoogle = async () => {
    await authService.linkWithGoogle()
  }

  const handleLinkWithEmailPassword = async (password: string) => {
    await authService.linkWithEmailPassword(password)
  }

  const handleUnlinkProvidersExcept = async (
    keepProviderId: authService.SwitchableProviderId
  ) => {
    await authService.unlinkProvidersExcept(keepProviderId)
  }

  const handleReloadUser = async () => {
    const currentUser = getFirebaseAuth().currentUser
    if (!currentUser) return
    await currentUser.reload()
    setProviderVersion((v) => v + 1)
  }

  const handleSignOut = async () => {
    try {
      await authService.signOut()
      return true
    } catch {
      return false
    }
  }

  const handleGetIdToken = async (): Promise<string | null> => {
    if (!user) return null
    return await authService.getIdToken(user)
  }

  const handleSignInAsGuest = async (): Promise<string> => {
    const result = await authService.signInAnonymously()
    return result.user.getIdToken()
  }

  const value: AuthContextType = {
    user,
    loading,
    signInWithEmail: handleSignInWithEmail,
    registerWithEmail: handleRegisterWithEmail,
    requestPasswordReset: handleRequestPasswordReset,
    signInWithGoogle: handleSignInWithGoogle,
    linkWithGoogle: handleLinkWithGoogle,
    linkWithEmailPassword: handleLinkWithEmailPassword,
    unlinkProvidersExcept: handleUnlinkProvidersExcept,
    reloadUser: handleReloadUser,
    signOut: handleSignOut,
    getIdToken: handleGetIdToken,
    signInAsGuest: handleSignInAsGuest,
    isGuest: user?.isAnonymous ?? false,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
