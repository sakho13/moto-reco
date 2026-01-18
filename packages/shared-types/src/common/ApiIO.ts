export type SuccessResponse<T> = {
  status: 'success'
  data: T
  message?: string
}

export type ErrorResponse<T = unknown> = {
  status: 'error'
  errorCode: ErrorCode
  message: string
  details?: T
}

export const ErrorCodeMap = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_FAILED: 'AUTH_FAILED',
  USER_NOT_REGISTERED: 'USER_NOT_REGISTERED',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
} as const

export type ErrorCode = keyof typeof ErrorCodeMap

// エラーコードとHTTPステータスコードのマッピング
export const ErrorCodeToHttpStatus = {
  INVALID_REQUEST: 400,
  VALIDATION_ERROR: 400,
  AUTH_FAILED: 401,
  USER_NOT_REGISTERED: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const satisfies Record<ErrorCode, number>

// HTTPステータスコードの型
export type HttpStatusCode = (typeof ErrorCodeToHttpStatus)[ErrorCode]

// ヘルパー関数: エラーコードから対応するHTTPステータスコードを取得
export function getHttpStatusFromErrorCode(errorCode: ErrorCode): number {
  return ErrorCodeToHttpStatus[errorCode]
}

export type ApiResponseUserProfile = {
  userId: string
  name: string
}

export type ApiResponseUserQuit = {
  recoveryCode: string
}

export type ApiResponseUserRecover = {
  userId: string
}

export type ApiResponseManufacturer = {
  manufacturers: {
    manufacturerId: string
    name: string
    nameEn: string
    country: string
  }[]
}

export type ApiResponseBikeSearch = {
  bikes: {
    bikeId: string
    manufacturerId: string
    manufacturer: string
    modelName: string
    displacement: number
    modelYear: number
  }[]
}

export type ApiResponseUserBikeRegister = {
  userBikeId: string
  myUserBikeId: string
}

export type ApiResponseUserBikeList = {
  bikes: {
    userBikeId: string
    myUserBikeId: string
    manufacturerName: string | null
    bikeId: string | null
    modelName: string | null
    nickname: string | null
    purchaseDate: string | null
    purchasePrice: number | null
    purchaseMileage: number | null
    totalMileage: number
    displacement: number
    modelYear: number | null
    isPublic: boolean
    createdAt: string
    updatedAt: string
  }[]
}

export type ApiResponseUserBikeDetail = {
  userBikeId: string
  myUserBikeId: string
  manufacturerName: string | null
  bikeId: string | null
  modelName: string | null
  nickname: string | null
  purchaseDate: string | null
  purchasePrice: number | null
  purchaseMileage: number | null
  totalMileage: number
  displacement: number
  modelYear: number | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export type ApiResponsePublicBikeList = {
  bikes: {
    myUserBikeId: string
    manufacturerName: string | null
    modelName: string | null
    nickname: string | null
    displacement: number
    modelYear: number | null
    totalMileage: number
    updatedAt: string
  }[]
}

export type ApiResponseFuelLogDetail = {
  fuelLogId: string
  refueledAt: string
  mileage: number
  previousMileage: number
  amount: number
  totalPrice: number
  memo: string | null
  fuelEfficiency: number | null // km/L (計算不可の場合はnull)
  pricePerLiter: number | null // 円/L (給油量0の場合はnull)
}

export type ApiResponseFuelLogList = ApiResponseFuelLogDetail[]

export type ApiResponseTouringDetail = {
  touringId: string
  title: string
  startDate: string
  endDate: string
  startMileage: number | null
  endMileage: number | null
}

export type ApiResponseTouringList = ApiResponseTouringDetail[]

export type ApiResponseFuelInsight = {
  averageFuelEfficiency: number | null
  averageAmount: number | null
  averageTotalPrice: number | null
  averagePricePerLiter: number | null
  minPricePerLiter: number | null
  maxPricePerLiter: number | null
}
