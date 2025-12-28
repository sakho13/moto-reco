'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@packages/ui'
import { MyBikeListSection } from '@/components/MyBikeListSection'
import { withAuth } from '@/lib/hoc/withAuth'

function Page() {
  const router = useRouter()

  return (
    <>
      <div className="w-full max-w-md flex flex-row gap-2">
        <Button
          onClick={() => {
            router.push('/home')
          }}
          variant="cloud"
        >
          ← 戻る
        </Button>

        <Button onClick={() => router.push('/bike/register')}>
          バイクを登録
        </Button>
      </div>

      <div className="w-full max-w-lg">
        <MyBikeListSection />
      </div>
    </>
  )
}

export default withAuth(Page)
