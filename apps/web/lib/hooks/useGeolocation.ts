'use client'

type GeoPosition = {
  latitude: number
  longitude: number
  accuracy: number
}

type GeoResult = {
  position: GeoPosition | null
  denied: boolean
}

/**
 * ブラウザのGeolocation APIで現在地を取得するフック
 */
export const useGeolocation = () => {
  /**
   * 現在地を取得する
   * 取得失敗時はposition=nullを返す（記録は位置情報なしで続行可能）
   * denied=trueの場合はユーザーが位置情報の使用を拒否している
   */
  const getCurrentPosition = (): Promise<GeoResult> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ position: null, denied: false })
        return
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            position: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            },
            denied: false,
          })
        },
        (error) => {
          resolve({
            position: null,
            denied: error.code === error.PERMISSION_DENIED,
          })
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
