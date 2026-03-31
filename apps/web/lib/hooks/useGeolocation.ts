'use client'

type GeoPosition = {
  latitude: number
  longitude: number
}

/**
 * ブラウザのGeolocation APIで現在地を取得するフック
 */
export const useGeolocation = () => {
  /**
   * 現在地を取得する
   * 取得失敗時はnullを返す（記録は位置情報なしで続行可能）
   */
  const getCurrentPosition = (): Promise<GeoPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        () => {
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }

  return { getCurrentPosition }
}
