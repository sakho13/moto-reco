'use client'

import { QuickFuelSection } from '@/components/QuickFuelSection'
import { TouringStartEndSection } from '@/components/TouringStartEndSection'
import { withAuth } from '@/lib/hoc/withAuth'

function Page() {
  return (
    <div className="w-full max-w-lg">
      {/* ツーリング開始停止（上） */}
      <TouringStartEndSection />

      {/* 給油クイック登録（下） */}
      <QuickFuelSection />
    </div>
  )
}

export default withAuth(Page)
