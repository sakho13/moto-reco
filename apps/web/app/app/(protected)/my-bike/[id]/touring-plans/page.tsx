'use client'

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@repo/ui/button'
import styles from './page.module.css'
import { PlanCard } from '@/components/touring/PlanCard'
import { apiGet } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function TouringPlansPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string

  const {
    data: plans,
    error,
    isLoading,
  } = useSWR(
    bikeId ? `/api/v1/user-bike/bike/${bikeId}/touring-plans` : null,
    async (url) => {
      const response = await apiGet(
        url as `/api/v1/user-bike/bike/${string}/touring-plans`
      )
      return response.data
    }
  )

  const handleDetail = (touringPlanId: string) => {
    router.push(`/app/my-bike/${bikeId}/touring-plans/${touringPlanId}`)
  }

  const handleRegister = () => {
    router.push(`/app/my-bike/${bikeId}/touring-plans/register`)
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center min-h-100">
          <p className="text-lg">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <>
        <div className="mb-4">
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}`)}
            variant="cloud"
          >
            ← 戻る
          </Button>
        </div>
        <div className={styles.card}>
          <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
          <p className={`mb-4 ${styles.bodyText}`}>
            {error instanceof ApiV1Error
              ? error.message
              : 'ツーリングプランの取得に失敗しました'}
          </p>
          <Button onClick={() => router.push(`/app/my-bike/${bikeId}`)}>
            バイク詳細に戻る
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="w-full max-w-md flex flex-row gap-2">
        <Button
          onClick={() => router.push(`/app/my-bike/${bikeId}`)}
          variant="cloud"
        >
          ← 戻る
        </Button>
        <Button onClick={handleRegister} variant="primary">
          プランを作成
        </Button>
        <Button
          onClick={() => router.push(`/app/my-bike/${bikeId}/tourings`)}
          variant="cloud"
        >
          履歴一覧
        </Button>
      </div>

      <div className="w-full max-w-md mt-3">
        <div className={styles.card}>
          {plans && plans.length > 0 ? (
            plans.map((plan) => (
              <PlanCard
                key={plan.touringPlanId}
                plan={plan}
                onClick={handleDetail}
              />
            ))
          ) : (
            <p className={`text-sm ${styles.mutedText}`}>
              ツーリングプランはまだ登録されていません
            </p>
          )}
        </div>
      </div>
    </>
  )
}

export default withAuth(TouringPlansPage)
