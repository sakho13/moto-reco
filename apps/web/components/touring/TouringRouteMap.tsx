import dynamic from 'next/dynamic'
import type { MapPoint } from './TouringRouteMapInner'

export type { MapPoint }

type Props = {
  points: MapPoint[]
  containerClassName: string | undefined
  onMapClick?: (lat: number, lng: number) => void
}

const TouringRouteMapInner = dynamic(() => import('./TouringRouteMapInner'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        fontSize: '0.875rem',
        color: 'var(--color-ink)',
        opacity: 0.5,
      }}
    >
      地図を読み込み中...
    </div>
  ),
})

export default function TouringRouteMap({
  points,
  containerClassName,
  onMapClick,
}: Props) {
  return (
    <TouringRouteMapInner
      points={points}
      containerClassName={containerClassName}
      onMapClick={onMapClick}
    />
  )
}
