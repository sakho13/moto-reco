'use client'

import type { AuthProvider } from '@refinedev/core'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase/config'

const getIdToken = async (user: User): Promise<string> => {
  return user.getIdToken()
}

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const auth = getFirebaseAuth()
      const { user } = await signInWithEmailAndPassword(auth, email, password)

      // 管理者ロールチェック
      const token = await getIdToken(user)
      const res = await fetch('/api/admin/auth/check', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        await signOut(auth)
        return {
          success: false,
          error: { name: 'Unauthorized', message: '管理者権限がありません' },
        }
      }

      return { success: true, redirectTo: '/' }
    } catch {
      return {
        success: false,
        error: {
          name: 'LoginError',
          message: 'メールアドレスまたはパスワードが正しくありません',
        },
      }
    }
  },

  logout: async () => {
    const auth = getFirebaseAuth()
    await signOut(auth)
    return { success: true, redirectTo: '/login' }
  },

  check: async () => {
    return new Promise((resolve) => {
      const auth = getFirebaseAuth()
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe()
        if (!user) {
          resolve({ authenticated: false, redirectTo: '/login' })
          return
        }
        const token = await getIdToken(user)
        const res = await fetch('/api/admin/auth/check', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          resolve({ authenticated: false, redirectTo: '/login' })
        } else {
          resolve({ authenticated: true })
        }
      })
    })
  },

  getIdentity: async () => {
    return new Promise((resolve) => {
      const auth = getFirebaseAuth()
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe()
        if (!user) {
          resolve(null)
          return
        }
        resolve({
          id: user.uid,
          name: user.email ?? user.uid,
          avatar: user.photoURL ?? undefined,
        })
      })
    })
  },

  onError: async (error) => {
    if (error?.status === 401 || error?.status === 403) {
      return { logout: true, redirectTo: '/login' }
    }
    return { error }
  },
}
