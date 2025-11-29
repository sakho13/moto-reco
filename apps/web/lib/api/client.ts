import { getFirebaseAuth } from '../firebase/config'

/**
 * 認証付きAPIリクエスト
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const auth = getFirebaseAuth()
  const user = auth.currentUser

  if (!user) {
    throw new Error('認証されていません')
  }

  const token = await user.getIdToken()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  return fetch(`${apiUrl}${url}`, {
    ...options,
    headers,
  })
}

/**
 * 認証付きGETリクエスト
 */
export const apiGet = async <T>(url: string): Promise<T> => {
  const response = await authenticatedFetch(url, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 認証付きPOSTリクエスト
 */
export const apiPost = async <T>(url: string, data: unknown): Promise<T> => {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 認証付きPUTリクエスト
 */
export const apiPut = async <T>(url: string, data: unknown): Promise<T> => {
  const response = await authenticatedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 認証付きDELETEリクエスト
 */
export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await authenticatedFetch(url, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }

  return response.json()
}
