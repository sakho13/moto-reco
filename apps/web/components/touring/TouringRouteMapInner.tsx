'use client'

import type L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import styles from './TouringRouteMapInner.module.css'
import { getStoneShape } from '@/lib/utils/touringJourney'

type Callback = (lat: number, lng: number) => void

export type MapPoint = {
  lat: number
  lng: number
  label: string
  /**
   * `skip` は寄らなかった地点。ピンだけを出し、経路の線には含めない。
   * `pending` はまだ着いていない地点。経路には含める
   */
  type: 'start' | 'spot' | 'break' | 'end' | 'skip' | 'pending'
  /** `focusedId` と `onPointClick` で地点を特定するためのID */
  id?: string
  /** ピンの中に出す印 */
  mark?: string
}

type Props = {
  points: MapPoint[]
  containerClassName: string | undefined
  onMapClick?: (lat: number, lng: number) => void
  /** 強調するピンのID */
  focusedId?: string | null
  onPointClick?: (id: string) => void
}

const PIN_TYPE_CLASS: Record<MapPoint['type'], string> = {
  start: styles.pinFlag!,
  end: styles.pinFlag!,
  spot: styles.pinStay!,
  break: styles.pinStay!,
  skip: styles.pinSkip!,
  pending: styles.pinSkip!,
}

const MARKED_PIN_HIT_SIZE = 44
const DOT_PIN_HIT_SIZE = 20

/** 同じ座標のピンが重なって選べなくならないよう、左右にずらす幅（px） */
const SAME_POINT_OFFSET = 30

const getSamePointOffset = (points: MapPoint[], index: number): number => {
  const target = points[index]!
  const samePoints = points.filter(
    (p) => p.lat === target.lat && p.lng === target.lng
  )
  const position = samePoints.indexOf(target)
  return (position - (samePoints.length - 1) / 2) * SAME_POINT_OFFSET
}

const buildPinElement = (point: MapPoint): HTMLElement => {
  const element = document.createElement('span')
  element.className = `${styles.pin} ${PIN_TYPE_CLASS[point.type]} ${
    point.mark ? styles.pinMarked : styles.pinDot
  }`
  element.textContent = point.mark ?? ''
  if (point.id) {
    element.style.borderRadius = getStoneShape(point.id)
  }
  return element
}

export default function TouringRouteMapInner({
  points,
  containerClassName,
  onMapClick,
  focusedId = null,
  onPointClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef(new Map<string, L.Marker>())
  const onMapClickRef = useRef<Callback | undefined>(onMapClick)
  onMapClickRef.current = onMapClick
  const onPointClickRef = useRef(onPointClick)
  onPointClickRef.current = onPointClick
  const focusedIdRef = useRef(focusedId)
  focusedIdRef.current = focusedId
  const pointsRef = useRef(points)
  pointsRef.current = points
  // 親の再描画で配列の参照だけが変わっても、地図を作り直さない
  const pointsKey = JSON.stringify(points)

  const applyFocus = (id: string | null) => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker, markerId) => {
      const isActive = markerId === id
      marker.getElement()?.classList.toggle(styles.pinHitActive!, isActive)
      marker.setZIndexOffset(isActive ? 1000 : 0)
      if (isActive && !map.getBounds().contains(marker.getLatLng())) {
        map.panTo(marker.getLatLng())
      }
    })
  }

  useEffect(() => {
    if (!containerRef.current) return
    let isCancelled = false
    const markers = markersRef.current
    const resizeObserver = new ResizeObserver(() => {
      mapRef.current?.invalidateSize()
    })
    resizeObserver.observe(containerRef.current)

    const removeMap = () => {
      markers.clear()
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }

    const initMap = async () => {
      const L = (await import('leaflet')).default
      if (isCancelled || !containerRef.current) return

      const currentPoints = pointsRef.current

      removeMap()

      const map = L.map(containerRef.current, { zoomControl: true })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      if (currentPoints.length > 0) {
        const routeLatLngs: L.LatLngExpression[] = currentPoints
          .filter((p) => p.type !== 'skip')
          .map((p) => [p.lat, p.lng])

        if (routeLatLngs.length > 1) {
          L.polyline(routeLatLngs, {
            className: styles.routeLine,
            weight: 4,
            interactive: false,
          }).addTo(map)
        }

        const addedMarkers: { marker: L.Marker; point: MapPoint }[] = []

        currentPoints.forEach((point, index) => {
          const hitSize = point.mark ? MARKED_PIN_HIT_SIZE : DOT_PIN_HIT_SIZE
          const isSelectable = Boolean(point.id && onPointClickRef.current)
          const offsetX = point.mark
            ? getSamePointOffset(currentPoints, index)
            : 0
          const marker = L.marker([point.lat, point.lng], {
            icon: L.divIcon({
              className: styles.pinHit,
              html: buildPinElement(point),
              iconSize: [hitSize, hitSize],
              iconAnchor: [hitSize / 2 - offsetX, hitSize / 2],
            }),
            keyboard: isSelectable,
            bubblingMouseEvents: !isSelectable,
          }).addTo(map)
          addedMarkers.push({ marker, point })

          marker.bindTooltip(point.label, {
            permanent: false,
            direction: 'top',
            offset: [0, -hitSize / 2],
          })

          if (point.id) {
            const { id } = point
            markers.set(id, marker)
            marker.on('click', () => onPointClickRef.current?.(id))
          }
        })

        const bounds = L.latLngBounds(
          currentPoints.map((p): L.LatLngTuple => [p.lat, p.lng])
        )
        map.fitBounds(bounds, { padding: [32, 32] })

        // ピンの要素は地図の表示範囲が決まった後に作られる
        addedMarkers.forEach(({ marker, point }) => {
          const element = marker.getElement()
          element?.setAttribute('aria-label', point.label)
          const { id } = point
          if (!id || !onPointClickRef.current) return
          element?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            onPointClickRef.current?.(id)
          })
        })
      } else {
        // ポイントなし: 日本全体を表示
        map.setView([36.0, 138.0], 5)
      }

      if (onMapClickRef.current) {
        map.getContainer().style.cursor = 'crosshair'
        map.on('click', (e: L.LeafletMouseEvent) => {
          onMapClickRef.current?.(e.latlng.lat, e.latlng.lng)
        })
      }

      applyFocus(focusedIdRef.current)
    }

    initMap()

    return () => {
      isCancelled = true
      resizeObserver.disconnect()
      removeMap()
    }
  }, [pointsKey])

  useEffect(() => {
    applyFocus(focusedId)
  }, [focusedId])

  return <div ref={containerRef} className={containerClassName} />
}
