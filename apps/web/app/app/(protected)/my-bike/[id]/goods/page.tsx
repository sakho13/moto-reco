'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { AttachedGoodsSection } from '@/components/goods/AttachedGoodsSection'
import { withAuth } from '@/lib/hoc/withAuth'

function BikeGoodsPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string

  return (
    <>
      <div className="w-full max-w-md mb-4">
        <Button
          onClick={() => router.push(`/app/my-bike/${bikeId}`)}
          variant="cloud"
        >
          ← 戻る
        </Button>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4 mb-20">
        <AttachedGoodsSection myUserBikeId={bikeId} />
      </div>
    </>
  )
}

export default withAuth(BikeGoodsPage)
