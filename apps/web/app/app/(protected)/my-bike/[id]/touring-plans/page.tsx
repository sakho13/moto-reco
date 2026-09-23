'use client'

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import { Button } from '@repo/ui/button'
import styles from './page.module.css'
import { TouringPlanLedgerList } from '@/components/bike/TouringPlanLedgerList'
import { PlanCard } from '@/components/touring/PlanCard'
import { apiGet } from '@/lib/api/client'
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
      <div className={styles.fallback}>
        <div className={styles.loadingBox}>
          <p className={styles.loadingText}>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.fallback}>
        <div className={styles.errorActions}>
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}`)}
            variant="cloud"
          >
            ← 戻る
          </Button>
        </div>

        <div className={styles.errorBox}>
          <h1 className={styles.errorTitle}>エラー</h1>
          <p className={styles.errorMessage}>
            {error instanceof ApiV1Error
              ? error.message
              : 'ツーリングプランの取得に失敗しました'}
          </p>
          <Button onClick={() => router.push(`/app/my-bike/${bikeId}`)}>
            愛車に戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`${styles.topBar} flex flex-row flex-wrap gap-2`}>
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

      <div className={`${styles.listLayout} mt-3`}>
        {plans && plans.length > 0 ? (
          <>
            <div className={styles.mobileOnly}>
              <div className={styles.card}>
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.touringPlanId}
                    plan={plan}
                    onClick={handleDetail}
                  />
                ))}
              </div>
            </div>
            <div className={styles.desktopOnly}>
              <TouringPlanLedgerList plans={plans} onSelect={handleDetail} />
            </div>
          </>
        ) : (
          <p className={`text-sm ${styles.mutedText}`}>
            ツーリングプランはまだ登録されていません
          </p>
        )}
      </div>
    </>
  )
}

export default withAuth(TouringPlansPage)
