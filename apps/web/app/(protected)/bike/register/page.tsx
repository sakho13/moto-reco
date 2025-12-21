'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import type {
  ApiResponseBikeSearch,
  SuccessResponse,
} from '@packages/shared-types'
import { Button } from '@packages/ui/button'
import { apiGet, apiPost, authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

type Step = 1 | 2 | 3

function BikeRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [selectedManufacturerId, setSelectedManufacturerId] = useState('')
  const [selectedBikeId, setSelectedBikeId] = useState('')
  const [selectedBike, setSelectedBike] = useState<{
    modelName: string
    displacement: number
    modelYear: number
  } | null>(null)
  const [modelNameSearch, setModelNameSearch] = useState('')
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

  // メーカー一覧を取得
  const { data: manufacturersData, error: manufacturersError } = useSWR(
    '/api/v1/bikes/manufacturers',
    apiGet
  )

  // バイク検索
  const { data: bikesData, isLoading: isBikesLoading } = useSWR(
    selectedManufacturerId && modelNameSearch
      ? `/api/v1/bikes/search?mf-op=eq&mf=${selectedManufacturerId}&model-name=${modelNameSearch}`
      : null,
    async (url) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      const json =
        (await response.json()) as SuccessResponse<ApiResponseBikeSearch>
      return json.data
    }
  )

  const handleManufacturerSelect = (manufacturerId: string) => {
    setSelectedManufacturerId(manufacturerId)
    if (manufacturerId) {
      setStep(2)
    }
  }

  const handleBikeSelect = (bike: {
    bikeId: string
    modelName: string
    displacement: number
    modelYear: number
  }) => {
    setSelectedBikeId(bike.bikeId)
    setSelectedBike({
      modelName: bike.modelName,
      displacement: bike.displacement,
      modelYear: bike.modelYear,
    })
    setStep(3)
  }

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
        bikeId: selectedBikeId || null,
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

  if (manufacturersError) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
          <p className="text-gray-700 mb-4">メーカー情報の取得に失敗しました</p>
          <Button onClick={() => router.push('/home')}>ホームに戻る</Button>
        </div>
      </div>
    )
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
              setModelNameSearch('')
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

        {/* ステップ1: メーカー選択 */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              ステップ1: メーカーを選択
            </h2>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedManufacturerId}
              onChange={(e) => handleManufacturerSelect(e.target.value)}
            >
              <option value="">メーカーを選択してください</option>
              {manufacturersData?.data.manufacturers.map(
                (m: {
                  manufacturerId: string
                  name: string
                  nameEn: string
                  country: string
                }) => (
                  <option key={m.manufacturerId} value={m.manufacturerId}>
                    {m.name}
                  </option>
                )
              )}
            </select>
          </div>
        )}

        {/* ステップ2: バイク検索・選択 */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              ステップ2: バイクを検索 (オプション)
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                モデル名で検索
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: CB400SF"
                value={modelNameSearch}
                onChange={(e) => setModelNameSearch(e.target.value)}
              />
            </div>

            {isBikesLoading && (
              <p className="text-center text-gray-600 py-4">検索中...</p>
            )}

            {bikesData && bikesData.bikes.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {bikesData.bikes.map((bike) => (
                  <button
                    key={bike.bikeId}
                    onClick={() => handleBikeSelect(bike)}
                    className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors"
                  >
                    <div className="font-semibold text-gray-900">
                      {bike.modelName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {bike.displacement}cc / {bike.modelYear}年式
                    </div>
                  </button>
                ))}
              </div>
            )}

            {bikesData && bikesData.bikes.length === 0 && modelNameSearch && (
              <p className="text-center text-gray-600 py-4">
                該当するバイクが見つかりませんでした
              </p>
            )}

            {/* スキップボタン */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                該当するバイクが見つからない場合は、モデルを選択せずに登録できます
              </p>
              <Button
                onClick={() => {
                  setSelectedBikeId('')
                  setSelectedBike(null)
                  setStep(3)
                }}
                variant="cloud"
                fullWidth
              >
                モデルを選択せずに登録
              </Button>
            </div>
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
