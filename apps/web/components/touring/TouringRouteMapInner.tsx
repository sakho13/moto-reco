'use client'

import type L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'

export type MapPoint = {
  lat: number
  lng: number
  label: string
  type: 'start' | 'spot' | 'end'
}

type Props = {
  points: MapPoint[]
  containerClassName: string | undefined
}

const COLORS: Record<MapPoint['type'], string> = {
  start: '#10b981',
  spot: '#6366f1',
  end: '#ef4444',
}

export default function TouringRouteMapInner({
  points,
  containerClassName,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return

    const initMap = async () => {
      const L = (await import('leaflet')).default

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      const map = L.map(containerRef.current!, { zoomControl: true })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      const latLngs: L.LatLngExpression[] = points.map((p) => [p.lat, p.lng])

      if (latLngs.length > 1) {
        L.polyline(latLngs, {
          color: '#6366f1',
          weight: 3,
          opacity: 0.7,
        }).addTo(map)
      }

      points.forEach((point) => {
        const color = COLORS[point.type]
        const radius = point.type === 'spot' ? 7 : 9
        const marker = L.circleMarker([point.lat, point.lng], {
          radius,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        }).addTo(map)

        marker.bindTooltip(point.label, {
          permanent: false,
          direction: 'top',
          offset: [0, -8],
        })
      })

      const bounds = L.latLngBounds(latLngs)
      map.fitBounds(bounds, { padding: [32, 32] })
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [points])

  return <div ref={containerRef} className={containerClassName} />
}
