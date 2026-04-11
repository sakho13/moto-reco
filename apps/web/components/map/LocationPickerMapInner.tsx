'use client'

import type L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'

type Location = {
  lat: number
  lng: number
}

type Props = {
  initialLocation?: Location
  onLocationChange: (lat: number, lng: number) => void
  containerClassName?: string
}

const DEFAULT_CENTER: Location = { lat: 36.0, lng: 138.0 }
const DEFAULT_ZOOM = 5
const SELECTED_ZOOM = 13
const MARKER_COLOR = '#6366f1'

/**
 * クリックで地点を選択できるLeafletマップ
 */
export default function LocationPickerMapInner({
  initialLocation,
  onLocationChange,
  containerClassName,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.CircleMarker | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }

      const center = initialLocation ?? DEFAULT_CENTER
      const zoom = initialLocation ? SELECTED_ZOOM : DEFAULT_ZOOM

      const map = L.map(containerRef.current!, { zoomControl: true })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      map.setView([center.lat, center.lng], zoom)

      if (initialLocation) {
        markerRef.current = L.circleMarker(
          [initialLocation.lat, initialLocation.lng],
          {
            radius: 9,
            fillColor: MARKER_COLOR,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          }
        ).addTo(map)
      }

      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          markerRef.current = L.circleMarker([lat, lng], {
            radius: 9,
            fillColor: MARKER_COLOR,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          }).addTo(map)
        }

        onLocationChange(lat, lng)
      })
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 外部から初期位置が変わった場合（現在地取得など）にマーカーを更新
  useEffect(() => {
    const map = mapRef.current
    if (!map || !initialLocation) return

    if (markerRef.current) {
      markerRef.current.setLatLng([initialLocation.lat, initialLocation.lng])
    } else {
      import('leaflet').then(({ default: L }) => {
        markerRef.current = L.circleMarker(
          [initialLocation.lat, initialLocation.lng],
          {
            radius: 9,
            fillColor: MARKER_COLOR,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          }
        ).addTo(map)
      })
    }

    map.setView(
      [initialLocation.lat, initialLocation.lng],
      Math.max(map.getZoom(), SELECTED_ZOOM)
    )
  }, [initialLocation])

  return <div ref={containerRef} className={containerClassName} />
}
