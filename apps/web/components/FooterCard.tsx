'use client'

import Link from 'next/link'
import { BaseCard } from '@repo/ui/baseCard'
import { APP_VERSION, GOOGLE_QA_FORM_URL } from '@/lib/statics'

export function FooterCard() {
  return (
    <BaseCard title="MotoReco">
      <div className="flex flex-col items-center gap-3 text-center">
        <Link
          href={GOOGLE_QA_FORM_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: 'var(--spacing-2) var(--spacing-5)',
            borderRadius: '999px',
            background: 'var(--color-primary)',
            color: 'var(--color-paper)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            textDecoration: 'none',
          }}
          aria-label="アンケートを新しいタブで開く"
        >
          ご意見・ご要望はこちら
        </Link>

        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
          <p className="m-0 text-sm">Created by SaKho</p>
          <p className="m-0 text-sm">@2025 MotoReco</p>
          <p className="m-0 text-sm opacity-70">ver {APP_VERSION}</p>
        </div>
      </div>
    </BaseCard>
  )
}
