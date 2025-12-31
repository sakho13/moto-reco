'use client'

import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'

export interface FuelLogCardProps {
  fuelLog: ApiResponseFuelLogDetail
  onEdit: (fuelLogId: string) => void
}

export const FuelLogCard = ({ fuelLog, onEdit }: FuelLogCardProps) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-background)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        padding: 'var(--spacing-4)',
        border: '1px solid var(--color-cloud)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--spacing-3)',
        }}
      >
        <div>
          <p
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-ink)',
              marginBottom: 'var(--spacing-1)',
            }}
          >
            {formatDate(fuelLog.refueledAt)}
          </p>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-ink)',
              opacity: 0.7,
            }}
          >
            走行距離: {fuelLog.mileage.toLocaleString()} km
          </p>
        </div>
        <Button
          onClick={() => onEdit(fuelLog.fuelLogId)}
          variant="cloud"
          size="sm"
        >
          編集
        </Button>
      </div>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 'var(--spacing-2)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        <dt style={{ color: 'var(--color-ink)', opacity: 0.7 }}>給油量:</dt>
        <dd style={{ color: 'var(--color-ink)' }}>
          {fuelLog.amount.toFixed(2)} L
        </dd>

        <dt style={{ color: 'var(--color-ink)', opacity: 0.7 }}>給油価格:</dt>
        <dd style={{ color: 'var(--color-ink)' }}>
          ¥{fuelLog.totalPrice.toLocaleString()}
        </dd>
      </dl>
    </div>
  )
}
