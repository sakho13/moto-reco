import type { GoodsCategory } from '../domain/goods'
import type { MaintenanceCategory, MaintenanceType } from '../domain/maintenance'
import type { MaintenanceLogItem } from '../domain/maintenanceLog'
import type {
  MaintenanceScheduleBasis,
  MaintenanceScheduleStatus,
} from '../domain/maintenanceSchedule'
import type {
  TouringPlanRouteType,
  TouringPlanSpotType,
} from '../domain/touringPlanSpot'
import type { UserPlan } from '../domain/user'

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
  FORBIDDEN: 'FORBIDDEN',
  USER_NOT_REGISTERED: 'USER_NOT_REGISTERED',
  GUEST_EXPIRED: 'GUEST_EXPIRED',
  USER_QUIT: 'USER_QUIT',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
} as const

export type ErrorCode = keyof typeof ErrorCodeMap

// エラーコードとHTTPステータスコードのマッピング
export const ErrorCodeToHttpStatus = {
  INVALID_REQUEST: 400,
  VALIDATION_ERROR: 400,
  AUTH_FAILED: 401,
  FORBIDDEN: 403,
  USER_NOT_REGISTERED: 403,
  GUEST_EXPIRED: 401,
  USER_QUIT: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const satisfies Record<ErrorCode, number>

// HTTPステータスコードの型
export type HttpStatusCode = (typeof ErrorCodeToHttpStatus)[ErrorCode]

// ヘルパー関数: エラーコードから対応するHTTPステータスコードを取得
export function getHttpStatusFromErrorCode(errorCode: ErrorCode): number {
  return ErrorCodeToHttpStatus[errorCode]
}

export type UserRole = 'ADMIN' | 'USER' | 'GUEST'

export type ApiResponseUserProfile = {
  userId: string
  name: string
  notificationEmail: string | null
  isProfilePublic: boolean
  role: UserRole
  /** 料金プラン。GUEST / ADMIN は null */
  plan: UserPlan | null
}

export type ApiResponseUserPlanHistory = {
  id: string
  plan: UserPlan
  changedAt: string
  changedByName: string
  reason: string | null
}[]

export type ApiResponsePublicUserPage = {
  userId: string
  name: string
  followerCount: number
  followingCount: number
  isFollowing: boolean
  bikes: {
    myUserBikeId: string
    manufacturerName: string | null
    modelName: string | null
    nickname: string | null
    displacement: number
    totalMileage: number
    ownedAt: string
    updatedAt: string
  }[]
  histories: ApiResponseAllBikesHistoryList
}

export type ApiResponseUserFollowList = {
  users: {
    userId: string
    name: string
  }[]
  total: number
  page: number
}

export type ApiResponseUserSearch = {
  users: {
    userId: string
    name: string
    isFollowing: boolean
  }[]
  total: number
  page: number
}

/** 退会処理完了時に復帰用トークンを返す（サインアウト後の復帰用URL表示ページに引き継ぐため） */
export type ApiResponseUserQuit = {
  recoveryToken: string
}

/** 復帰処理も完了メッセージのみを返す（非認証の公開エンドポイントのため個人情報は含めない） */
export type ApiResponseUserRecover = Record<string, never>

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

export type ApiResponseGoodsManufacturer = {
  manufacturers: {
    goodsManufacturerId: string
    name: string
    nameEn: string | null
  }[]
}

export type ApiResponseGoodsModelSearch = {
  models: {
    goodsModelId: string
    goodsManufacturerId: string
    manufacturerName: string
    modelNumber: string
    name: string
    category: GoodsCategory
    amazonUrl: string | null
    rakutenUrl: string | null
    officialUrl: string | null
  }[]
}

export type ApiResponseUserGoodsDetail = {
  userGoodsId: string
  userMyBikeId: string | null
  purchasedAt: string | null
  price: number | null
  memo: string | null
  goodsModelId: string
  goodsManufacturerId: string
  manufacturerName: string
  modelNumber: string
  modelName: string
  category: GoodsCategory
  amazonUrl: string | null
  rakutenUrl: string | null
  officialUrl: string | null
  createdAt: string
  updatedAt: string
}

export type ApiResponseUserGoodsList = ApiResponseUserGoodsDetail[]

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
    createdAt: string
    updatedAt: string
    fuelLogCount: number
    touringCount: number
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
  createdAt: string
  updatedAt: string
  fuelLogCount: number
  touringCount: number
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
  isFullTank: boolean // 満タン給油かどうか（false: 継ぎ足し給油）
  fuelEfficiency: number | null // km/L (継ぎ足し給油、または計算不可の場合はnull)
  pricePerLiter: number | null // 円/L (給油量0の場合はnull)
  touringId: string | null // ツーリングID
  touringTitle: string | null // ツーリングタイトル
}

export type ApiResponseFuelLogList = ApiResponseFuelLogDetail[]

export type ApiResponseMaintenanceLogDetail = {
  maintenanceLogId: string
  performedAt: string
  mileage: number
  memo: string | null
  items: MaintenanceLogItem[]
}

export type ApiResponseMaintenanceLogList = ApiResponseMaintenanceLogDetail[]

/**
 * 点検予定（メンテナンス項目1件分）
 *
 * @remarks
 * Issue #575「2. 点検の予定」の仕様に基づく。ユーザーごとの交換サイクル設定は
 * 持たず、メンテナンス項目マスタの既定値（`recommendedMileageInterval` /
 * `recommendedPeriodMonths`）と直近の整備記録から算出する。
 */
export type ApiResponseMaintenanceScheduleItem = {
  type: MaintenanceType
  category: MaintenanceCategory
  typeName: string
  categoryName: string
  /** 採用した基準。算出不能（記録なし・推奨間隔未設定）の場合は null */
  basis: MaintenanceScheduleBasis | null
  /** 残り走行距離（km）。basisが MILEAGE の場合のみ non-null。超過時は負値 */
  remainingMileage: number | null
  /** 次回予定日（ISO 8601形式）。basisが PERIOD の場合のみ non-null */
  dueDate: string | null
  /** 次回予定日までの残り日数。basisが PERIOD の場合のみ non-null。超過時は負値 */
  remainingDays: number | null
  /** 算出根拠となった直近の整備記録。記録がない場合は null */
  lastRecord: {
    performedAt: string
    mileage: number
  } | null
  status: MaintenanceScheduleStatus
}

/** 残りが少ない順（＝到来が早い順）に並んだ点検予定一覧 */
export type ApiResponseMaintenanceScheduleList =
  ApiResponseMaintenanceScheduleItem[]

export type ApiResponsePhotoDetail = {
  photoId: string
  photoUrl: string
  storagePath: string
  memo: string | null
  takenAt: string
}

export type ApiResponseTouringPhotoList = ApiResponsePhotoDetail[]
export type ApiResponseSpotPhotoList = ApiResponsePhotoDetail[]
export type ApiResponseBikePhotoList = ApiResponsePhotoDetail[]

export type ApiResponsePhotoUploadUrl = {
  signedUploadUrl: string
  photoPath: string
  /** アップロード先へのHTTPメソッド。Storage Emulatorは署名付きURLでの書き込みに対応していないため、開発環境ではPOSTになる */
  uploadMethod: 'PUT' | 'POST'
}[]

/** マイフォト（ユーザーの全写真を横断した一元ギャラリー）の1件 */
export type ApiResponseUserPhotoDetail = ApiResponsePhotoDetail & {
  attachments: (
    | { type: 'TOURING'; touringId: string }
    | { type: 'SPOT'; spotId: string }
    | { type: 'BIKE'; myUserBikeId: string }
  )[]
}

export type ApiResponseUserPhotoList = ApiResponseUserPhotoDetail[]

export type ApiResponseBikeHistoryItem =
  | {
      type: 'FUEL_LOG'
      occurredAt: string
      fuelLog: ApiResponseFuelLogDetail
    }
  | {
      type: 'TOURING'
      occurredAt: string
      touring: ApiResponseTouringDetail
    }

export type ApiResponseBikeHistoryList = ApiResponseBikeHistoryItem[]

export type ApiResponseAllBikesHistoryItem = ApiResponseBikeHistoryItem & {
  bikeId: string
  bikeName: string
}

export type ApiResponseAllBikesHistoryList = ApiResponseAllBikesHistoryItem[]

export type ApiResponseTouringDetail = {
  touringId: string
  touringPlanId: string | null
  title: string
  startDate: string
  endDate: string
  startMileage: number | null
  endMileage: number | null
  startLatitude: number | null
  startLongitude: number | null
  endLatitude: number | null
  endLongitude: number | null
  status: 'STARTED' | 'COMPLETED'
  fuelLogIds: string[]
}

export type ApiResponseTouringList = ApiResponseTouringDetail[]

export type ApiResponsePublicTouringList = {
  tourings: {
    touringId: string
    title: string
    startDate: string
    endDate: string
    startMileage: number | null
    endMileage: number | null
    status: 'STARTED' | 'COMPLETED'
  }[]
}

export type MopedTestAnswerOption = 'true' | 'false'

export type ApiResponseMopedTestQuestion = {
  questionId: string
  statement: string
  category: string
  correctAnswer: MopedTestAnswerOption
  explanation: string
  imagePath?: string
}

export type ApiResponseMopedTestQuestionSet = {
  title: string
  version: string
  questionCount: number
  passScore: number
  questions: ApiResponseMopedTestQuestion[]
}

export type ApiResponseOngoingTouring = {
  touring: ApiResponseTouringDetail | null
}

export type ApiResponseBikeOngoingTouring = {
  myUserBikeId: string
  ongoingTouring: ApiResponseTouringDetail | null
}

export type ApiResponseBikesOngoingTourings = {
  bikes: ApiResponseBikeOngoingTouring[]
}

export type ApiResponseSpotDetail = {
  spotId: string
  touringId: string
  type: 'SPOT' | 'BREAK'
  name: string | null
  memo: string | null
  latitude: number | null
  longitude: number | null
  // プラン由来の参考予定値（プランから開始した場合にコピーされる。常にこの意味）
  plannedArrivalAt: string | null
  plannedDepartureAt: string | null
  // 実績（常にこの意味。statusに関わらず固定）
  arrivedAt: string | null
  departedAt: string | null
  isSkipped: boolean
  skippedAt: string | null
  sortOrder: number
}

export type ApiResponseSpotList = ApiResponseSpotDetail[]

// ツーリングプランの出発地・目的地（共通）
export type ApiResponseTouringPlanLocation = {
  touringPlanSpotId: string
  latitude: number | null
  longitude: number | null
  name: string | null
  memo: string | null
  plannedArrivalOffsetMinutes: number | null
  plannedDepartureOffsetMinutes: number | null
  stayMinutes: number | null
  travelMinutesFromPrev: number | null
  routeTypeFromPrev: TouringPlanRouteType | null
}

export type ApiResponseTouringPlanDetail = {
  touringPlanId: string
  title: string
  createdAt: string
  updatedAt: string
  startLocation: ApiResponseTouringPlanLocation | null
  destinationLocation: ApiResponseTouringPlanLocation | null
  // このプランから開始されたツーリングのID一覧
  touringIds: string[]
}

export type ApiResponseTouringPlanListItem = {
  touringPlanId: string
  title: string
  createdAt: string
  updatedAt: string
  destination: {
    latitude: number | null
    longitude: number | null
    name: string | null
  } | null
}

export type ApiResponseTouringPlanList = ApiResponseTouringPlanListItem[]

export type ApiResponseTouringPlanSpotDetail = {
  touringPlanSpotId: string
  touringPlanId: string
  type: TouringPlanSpotType
  name: string | null
  memo: string | null
  latitude: number | null
  longitude: number | null
  plannedArrivalOffsetMinutes: number | null
  plannedDepartureOffsetMinutes: number | null
  stayMinutes: number | null
  travelMinutesFromPrev: number | null
  routeTypeFromPrev: TouringPlanRouteType | null
  sortOrder: number
}

// GET /spots はSTART/DESTINATION込みの統合順序リストを返す
export type ApiResponseTouringPlanSpotList = ApiResponseTouringPlanSpotDetail[]

export type ApiResponseFuelInsight = {
  averageFuelEfficiency: number | null
  averageAmount: number | null
  averageTotalPrice: number | null
  averagePricePerLiter: number | null
  minPricePerLiter: number | null
  maxPricePerLiter: number | null
}

// 通知タイプ
export type NotificationType = 'FOLLOWED'

// アナウンスタイプ
export type AnnouncementType = 'SYSTEM_MAINTENANCE' | 'RELEASE_ANNOUNCEMENT'

// アナウンスステータス
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'EXPIRED'

// ユーザー個別通知
export type ApiResponseNotificationItem = {
  notificationId: string
  type: NotificationType
  title: string
  body: string
  metadata: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export type ApiResponseNotificationList = {
  notifications: ApiResponseNotificationItem[]
  total: number
  page: number
}

export type ApiResponseNotificationUnreadCount = {
  count: number
}

// システムアナウンス (一般ユーザー向け)
export type ApiResponseAnnouncementItem = {
  announcementId: string
  type: AnnouncementType
  title: string
  body: string
  version: string | null
  publishedAt: string
  isRead: boolean
}

export type ApiResponseAnnouncementList = {
  announcements: ApiResponseAnnouncementItem[]
}

// システムアナウンス (管理者向け)
export type ApiResponseAdminAnnouncementItem = {
  announcementId: string
  type: AnnouncementType
  title: string
  body: string
  version: string | null
  status: AnnouncementStatus
  scheduledAt: string | null
  publishedAt: string | null
  readCount: number
  createdAt: string
  updatedAt: string
}

export type ApiResponseAdminAnnouncementList = {
  announcements: ApiResponseAdminAnnouncementItem[]
}

export type ApiResponseAdminAnnouncementDetail =
  ApiResponseAdminAnnouncementItem

// リリースノート (公開ページ向け)
export type ApiResponseReleaseNoteItem = {
  announcementId: string
  version: string
  title: string
  body: string
  publishedAt: string
}

export type ApiResponseReleaseNoteList = {
  releaseNotes: ApiResponseReleaseNoteItem[]
}
