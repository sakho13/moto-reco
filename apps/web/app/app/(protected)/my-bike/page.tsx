'use client'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@repo/ui/button'
import { MyBikeListSection } from '@/components/MyBikeListSection'
import { apiGet } from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { withAuth } from '@/lib/hoc/withAuth'

const GUEST_PLAN_BIKE_LIMIT = 1

function Page() {
  const router = useRouter()
  const { isGuest } = useAuth()

  // MyBikeListSection と同じ SWR キーを使いキャッシュを共有する
  const { data: bikesData, isLoading: bikesLoading } = useSWR(
    '/api/v1/user-bike/bikes',
    async (url) => {
      const response = await apiGet(url)
      return response.data
    }
  )
  const bikes = bikesData?.bikes ?? []
  const isAtGuestBikeLimit =
    isGuest && !bikesLoading && bikes.length >= GUEST_PLAN_BIKE_LIMIT

  return (
    <>
      <div className="w-full max-w-md flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <Button
            onClick={() => router.push('/app/bike/register')}
            disabled={isAtGuestBikeLimit}
          >
            バイクを登録
          </Button>
        </div>
        {isAtGuestBikeLimit && (
          <p className="text-sm text-gray-500">
            ゲストアカウントはバイクを{GUEST_PLAN_BIKE_LIMIT}
            台まで登録できます。
          </p>
        )}
      </div>

      <div className="w-full max-w-lg">
        <MyBikeListSection />
      </div>
    </>
  )
}

export default withAuth(Page)
