'use client'

import { ChevronDown, Motorbike as BikeIcon, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { AccountLimitsValue } from '@repo/shared-domain'
import { Button } from '@repo/ui/button'
import styles from './BikeSwitcher.module.css'
import { apiGet } from '@/lib/api/client'
import { getBikeDisplayMeta, getBikeDisplayName } from '@/lib/bike'
import { useActiveBike } from '@/lib/hooks/useActiveBike'
import { useAuth } from '@/lib/hooks/useAuth'

/**
 * ヘッダーに置くアクティブ車両の表示・切り替え・追加UI
 *
 * @remarks
 * - バイク未登録: 何も表示しない
 * - バイク1台以上: タップでドロップダウンを開ける。2台以上のときは車両の
 *   切り替えができ、台数によらずドロップダウン最下部から2台目以降の登録
 *   （`/app/bike/register`）に到達できる。
 *   以前は2台以上のときしかドロップダウンを開けず、1台のときに2台目を
 *   追加する導線がどこにも無かった（Issue #575で `/app/my-bike` の一覧が
 *   廃止された際に失われた）ため、1台のときも開けるようにしている。
 * - 登録上限（`AccountLimitsValue`: ゲスト1台 / 無料2台 / プレミアム10台）に
 *   達している場合は「バイクを追加」を押せない状態にし、理由を添える。
 */
export function BikeSwitcher() {
  const router = useRouter()
  const { isGuest } = useAuth()
  const { bikes, activeBike, setActiveBikeId, isLoading } = useActiveBike()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 台数上限の判定は `AccountLimitsValue`（登録APIが上限超過時に返す
  // エラーメッセージと同じ生成元）を唯一の出所にする。ゲストは同期的に
  // 判定できるが、通常ユーザーはプラン情報の取得を待つ必要があるため、
  // `BikeRegisterForm` と同じパターンでプロフィールAPIを叩く。
  const { data: profile } = useSWR(
    isGuest ? null : '/api/v1/user/profile',
    async (url) => {
      const response = await apiGet(url)
      return response.data
    }
  )
  const bikeLimits = isGuest
    ? AccountLimitsValue.from('GUEST', null)
    : AccountLimitsValue.from('USER', profile?.plan ?? null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isLoading || !activeBike || bikes.length === 0) {
    return null
  }

  const activeBikeName = getBikeDisplayName(activeBike)
  const canSwitch = bikes.length > 1
  const isAtBikeLimit = bikeLimits.isOver('bike', bikes.length)

  const handleAddBike = () => {
    setIsOpen(false)
    router.push('/app/bike/register')
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <Button
        type="button"
        variant="cloud"
        size="sm"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`アクティブ車両: ${activeBikeName}。タップして${
          canSwitch ? '車両を切り替える' : 'バイクを追加する'
        }`}
        title={getBikeDisplayMeta(activeBike)}
        className={styles.trigger}
      >
        <span className={styles.triggerContent}>
          <BikeIcon size={16} strokeWidth={2} aria-hidden="true" />
          <span className={styles.name}>{activeBikeName}</span>
          <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
        </span>
      </Button>

      {isOpen && (
        <div className={styles.dropdown}>
          <ul className={styles.optionList} role="listbox">
            {bikes.map((bike) => {
              const isActive = bike.myUserBikeId === activeBike.myUserBikeId

              return (
                <li key={bike.myUserBikeId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
                    onClick={() => {
                      setActiveBikeId(bike.myUserBikeId)
                      setIsOpen(false)
                    }}
                  >
                    <span className={styles.optionName}>
                      {getBikeDisplayName(bike)}
                    </span>
                    <span className={styles.optionMeta}>
                      {getBikeDisplayMeta(bike)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className={styles.divider} role="separator" />

          <button
            type="button"
            className={styles.addOption}
            onClick={handleAddBike}
            disabled={isAtBikeLimit}
            title={isAtBikeLimit ? bikeLimits.limitMessage('bike') : undefined}
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            バイクを追加
          </button>
          {isAtBikeLimit && (
            <p className={styles.limitNote}>
              {bikeLimits.limitMessage('bike')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
