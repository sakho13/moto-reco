'use client'

import { useEffect, useState } from 'react'
import { BaseCard } from '@packages/ui/baseCard'
import { apiGet } from '@/lib/api/client'

export function ProfileCard() {
  const [name, setName] = useState('')

  useEffect(() => {
    _fetchProfile().then((profile) => {
      if (profile) {
        setName(profile.name)
      }
    })
  }, [])

  const _fetchProfile = async () => {
    try {
      const result = await apiGet('/api/v1/user/profile')
      return result.data
    } catch (error) {
      console.error('プロフィールの取得に失敗しました:', error)
      return null
    }
  }

  return (
    <BaseCard title="プロフィール">
      <div>
        <p>名前: {name || '未設定'}</p>
      </div>
    </BaseCard>
  )
}
