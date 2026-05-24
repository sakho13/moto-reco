'use client'

import simpleRestProvider from '@refinedev/simple-rest'
import axios from 'axios'
import { getFirebaseAuth } from '@/lib/firebase/config'

const axiosInstance = axios.create()

// リクエストインターセプターで Firebase IDトークンを自動付与
axiosInstance.interceptors.request.use(async (config) => {
  const auth = getFirebaseAuth()
  // authStateReady() でページロード直後のauth状態確定を待つ
  await auth.authStateReady()
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const dataProvider = simpleRestProvider('/api/admin', axiosInstance)
