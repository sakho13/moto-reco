'use client'

import { QuickFuelSection } from '@/components/QuickFuelSection'
import { withAuth } from '@/lib/hoc/withAuth'

function Page() {
  return (
    <div className="w-full max-w-lg">
      <QuickFuelSection />
    </div>
  )
}

export default withAuth(Page)
