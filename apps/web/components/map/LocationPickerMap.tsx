import dynamic from 'next/dynamic'

export type LocationPickerMapProps = {
  initialLocation?: { lat: number; lng: number }
  onLocationChange: (lat: number, lng: number) => void
  containerClassName?: string
}

/**
 * クリックで地点を選択できるマップコンポーネント（SSR無効）
 */
const LocationPickerMap = dynamic(() => import('./LocationPickerMapInner'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '200px',
        opacity: 0.5,
        fontSize: '0.875rem',
      }}
    >
      地図を読み込み中...
    </div>
  ),
})

export default LocationPickerMap
