'use client'

import { useState } from 'react'
import LocationPickerMap from './LocationPickerMap'
import { XIcon } from '@/components/icons/XIcon'
import styles from '@/components/touring/TouringEditModal.module.css'
import { useGeolocation } from '@/lib/hooks/useGeolocation'

type Location = {
  lat: number
  lng: number
}

type LocationPickerModalProps = {
  title: string
  initialLocation: Location | null
  isSaving: boolean
  onLocationSaved: (lat: number, lng: number) => void
  onClose: () => void
}

/**
 * 位置編集専用モーダル。マップをクリックすると即時保存する。
 */
export function LocationPickerModal({
  title,
  initialLocation,
  isSaving,
  onLocationSaved,
  onClose,
}: LocationPickerModalProps) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(
    initialLocation
  )
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const { getCurrentPosition } = useGeolocation()

  const handleLocationChange = (lat: number, lng: number) => {
    const loc = { lat, lng }
    setCurrentLocation(loc)
    onLocationSaved(lat, lng)
  }

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true)
    const result = await getCurrentPosition()
    setIsGettingLocation(false)

    if (result.denied) {
      return
    }
    if (!result.position) {
      return
    }

    const loc = {
      lat: result.position.latitude,
      lng: result.position.longitude,
    }
    setCurrentLocation(loc)
    onLocationSaved(loc.lat, loc.lng)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="閉じる"
          >
            <XIcon />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs opacity-50">
              {currentLocation
                ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`
                : '未設定'}
              {isSaving && ' — 保存中...'}
            </p>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation || isSaving}
              className="text-xs border rounded px-2 py-1 disabled:opacity-50"
            >
              {isGettingLocation ? '取得中...' : '現在地を使用'}
            </button>
          </div>

          <p className="text-xs opacity-40">
            地図をクリックして位置を設定できます
          </p>

          <div
            className="border rounded overflow-hidden"
            style={{ height: 320 }}
          >
            <LocationPickerMap
              initialLocation={currentLocation ?? undefined}
              onLocationChange={handleLocationChange}
              containerClassName="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
