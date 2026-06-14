import { describe, expect, test } from 'vitest'
import { buildGoogleMapsTwoPointUrl } from '@/lib/utils/googleMaps'

const FROM = { lat: 35.681236, lng: 139.767125 }
const TO = { lat: 35.170915, lng: 136.881537 }

describe('buildGoogleMapsTwoPointUrl', () => {
  test('routeTypeを渡さない場合、avoidパラメータが含まれない', () => {
    const url = buildGoogleMapsTwoPointUrl(FROM, TO)

    expect(url).toBe(
      `https://www.google.com/maps/dir/?api=1&origin=${FROM.lat},${FROM.lng}&destination=${TO.lat},${TO.lng}`
    )
    expect(url).not.toContain('avoid')
  })

  test('routeTypeがnullの場合、avoidパラメータが含まれない', () => {
    const url = buildGoogleMapsTwoPointUrl(FROM, TO, null)

    expect(url).not.toContain('avoid')
  })

  test('routeTypeがGENERALの場合、avoid=highways,tollsが付与される', () => {
    const url = buildGoogleMapsTwoPointUrl(FROM, TO, 'GENERAL')

    expect(url).toBe(
      `https://www.google.com/maps/dir/?api=1&origin=${FROM.lat},${FROM.lng}&destination=${TO.lat},${TO.lng}&avoid=highways,tolls`
    )
  })

  test('routeTypeがHIGHWAYの場合、avoidパラメータが含まれない', () => {
    const url = buildGoogleMapsTwoPointUrl(FROM, TO, 'HIGHWAY')

    expect(url).not.toContain('avoid')
  })

  test('routeTypeがMIXEDの場合、avoidパラメータが含まれない', () => {
    const url = buildGoogleMapsTwoPointUrl(FROM, TO, 'MIXED')

    expect(url).not.toContain('avoid')
  })
})
