'use client'

import useSWR from 'swr'
import { BaseCard } from '@repo/ui/baseCard'
import { apiGet } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'

const PLAN_LABEL: Record<string, string> = {
  FREE: 'フリープラン',
  PREMIUM: 'プレミアムプラン',
}

function PlanPage() {
  const { data: profile } = useSWR('/api/v1/user/profile', (url) =>
    apiGet(url).then((r) => r.data)
  )
  const { data: histories } = useSWR('/api/v1/user/plan/histories', (url) =>
    apiGet(url).then((r) => r.data)
  )

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      <BaseCard title="現在のプラン">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">プラン</span>
            <span>
              {profile?.plan != null
                ? (PLAN_LABEL[profile.plan] ?? profile.plan)
                : '-'}
            </span>
          </div>
        </div>
      </BaseCard>

      {histories != null && histories.length > 0 && (
        <BaseCard title="プラン変更履歴">
          <div className="flex flex-col gap-2 text-sm">
            {histories.map((h) => (
              <div
                key={h.id}
                className="flex flex-col gap-0.5 border-b last:border-b-0 pb-2 last:pb-0"
              >
                <div className="flex justify-between">
                  <span className="text-gray-500">プラン</span>
                  <span>{PLAN_LABEL[h.plan] ?? h.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">変更日</span>
                  <span>
                    {new Date(h.changedAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                {h.reason != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">理由</span>
                    <span className="text-right max-w-[60%]">{h.reason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </BaseCard>
      )}
    </div>
  )
}

export default withAuth(PlanPage)
