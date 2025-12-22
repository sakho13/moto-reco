'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { mutate } from 'swr'
import { Button } from '@packages/ui/button'
import { apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

type Step = 1 | 2 | 3

function BikeRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [selectedBike, setSelectedBike] = useState<{
    modelName: string
    displacement: number
    modelYear: number
  } | null>(null)
  const [formData, setFormData] = useState({
    nickname: '',
    purchaseDate: '',
    purchasePrice: '',
    purchaseMileage: '',
    totalMileage: '',
    displacement: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // メーカー一覧とバイク検索のAPI呼び出しは無効化されているため削除

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // 排気量の決定: selectedBikeがあればそれを使用、なければformDataから取得
      const displacement = selectedBike
        ? selectedBike.displacement
        : Number(formData.displacement)

      await apiPost('/api/v1/user-bike/register', {
        bikeId: null,
        displacement: displacement,
        serialNumber: null,
        nickname: formData.nickname || null,
        purchaseDate: formData.purchaseDate || null,
        purchasePrice: formData.purchasePrice
          ? Number(formData.purchasePrice)
          : null,
        purchaseMileage: formData.purchaseMileage
          ? Number(formData.purchaseMileage)
          : null,
        totalMileage: Number(formData.totalMileage) || 0,
      })

      // 成功時、SWRキャッシュを更新してホームへ
      await mutate('/api/v1/user-bike/bikes')
      router.push('/home')
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-4">
        <Button
          onClick={() => {
            if (step === 1) {
              router.push('/home')
            } else if (step === 2) {
              setStep(1)
            } else {
              setStep(2)
            }
          }}
          variant="cloud"
        >
          ← 戻る
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">バイク登録</h1>

        {/* ステップインジケーター */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ステップ1: メーカー選択（無効化） */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              ステップ1: メーカーを選択
            </h2>

            {/* 無効化の理由を説明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-700">
                バイクデータベースの準備中のため、現在メーカー選択は利用できません。
                排気量を直接入力する方式でご登録いただけます。
              </p>
            </div>

            {/* 無効化されたselect */}
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed opacity-60 mb-4"
              disabled
              value=""
            >
              <option value="">
                メーカーを選択してください（現在利用不可）
              </option>
            </select>

            {/* 次へボタン */}
            <Button onClick={() => setStep(2)} variant="cloud" fullWidth>
              次へ
            </Button>
          </div>
        )}

        {/* ステップ2: バイク検索（無効化） */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              ステップ2: バイクを検索 (現在準備中)
            </h2>

            {/* 無効化の理由を説明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-700">
                バイクデータベースの準備中です。排気量を直接入力してご登録ください。
              </p>
            </div>

            {/* 無効化された検索フィールド */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                モデル名で検索
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed opacity-60"
                placeholder="例: CB400SF（現在利用不可）"
                disabled
              />
            </div>

            {/* 次へボタン */}
            <Button
              onClick={() => {
                setSelectedBike(null)
                setStep(3)
              }}
              variant="cloud"
              fullWidth
            >
              次へ
            </Button>
          </div>
        )}

        {/* ステップ3: 登録情報入力 */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              ステップ3: 登録情報を入力
            </h2>

            {selectedBike ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="font-semibold text-blue-900">
                  選択したバイク: {selectedBike.modelName}
                </p>
                <p className="text-sm text-blue-700">
                  {selectedBike.displacement}cc / {selectedBike.modelYear}年式
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="font-semibold text-gray-900">モデル未選択</p>
                <p className="text-sm text-gray-600">
                  排気量を手動で入力してください
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* モデル未選択の場合のみ排気量入力を表示 */}
              {!selectedBike && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    排気量 (cc) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.displacement}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        displacement: e.target.value,
                      }))
                    }
                    min="1"
                    step="1"
                    required
                    placeholder="例: 400"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ニックネーム (任意)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.nickname}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nickname: e.target.value,
                    }))
                  }
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  購入日 (任意)
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.purchaseDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      purchaseDate: e.target.value,
                    }))
                  }
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  購入価格 (任意)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.purchasePrice}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      purchasePrice: e.target.value,
                    }))
                  }
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  購入時走行距離 (任意)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.purchaseMileage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      purchaseMileage: e.target.value,
                    }))
                  }
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  現在の走行距離 <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.totalMileage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      totalMileage: e.target.value,
                    }))
                  }
                  min="0"
                  step="1"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                fullWidth
                loading={isSubmitting}
              >
                {isSubmitting ? '登録中...' : '登録する'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(BikeRegisterPage)
