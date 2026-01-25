import {
  createTouringId,
  MyUserBikeId,
  TouringId,
  UserId,
} from '@repo/shared-types'
import { TouringEntity } from '../entities/TouringEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'
import { ITouringRepository } from '../interfaces/ITouringRepository'
import { TouringSearchParams } from '../valueObjects/TouringSearchParams'

type RegisterTouringParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  title: string
  startDate: Date
  endDate: Date
  startMileage?: number
  endMileage?: number
}

type StartTouringParams = {
  action: 'start'
  myUserBikeId: MyUserBikeId
  userId: UserId
  title?: string
  startDate?: Date
  startMileage?: number
}

type EndTouringParams = {
  action: 'end'
  myUserBikeId: MyUserBikeId
  userId: UserId
  touringId: string
  endDate?: Date
  endMileage?: number
}

type TouringActionParams = StartTouringParams | EndTouringParams

type UpdateTouringParams = {
  touringId: TouringId
  myUserBikeId: MyUserBikeId
  userId: UserId
  title?: string
  startDate?: Date
  endDate?: Date
  startMileage?: number
  endMileage?: number
}

export class TouringService {
  constructor(
    private touringRepository: ITouringRepository,
    private myUserBikeRepository: IMyUserBikeRepository
  ) {}

  public async registerTouring(
    params: RegisterTouringParams
  ): Promise<TouringEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    try {
      const touring = new TouringEntity({
        touringId: createTouringId(''),
        myUserBikeId: params.myUserBikeId,
        title: params.title,
        startDate: params.startDate,
        endDate: params.endDate,
        startMileage: params.startMileage ?? null,
        endMileage: params.endMileage ?? null,
      })

      return await this.touringRepository.createTouring(touring)
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  public async handleTouringAction(
    params: TouringActionParams
  ): Promise<TouringEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    try {
      if (params.action === 'start') {
        const startDate = params.startDate ?? new Date()
        const title = params.title ?? 'ツーリング'
        const touring = new TouringEntity({
          touringId: createTouringId(''),
          myUserBikeId: params.myUserBikeId,
          title,
          startDate,
          endDate: startDate,
          startMileage: params.startMileage ?? null,
          endMileage: null,
        })

        return await this.touringRepository.createTouring(touring)
      }

      const existingTouring = await this.touringRepository.findTouringById(
        createTouringId(params.touringId),
        params.myUserBikeId
      )

      if (!existingTouring) {
        throw new ApiV1Error(
          'NOT_FOUND',
          '指定されたツーリングが見つかりません'
        )
      }

      const endDate = params.endDate ?? new Date()
      const touring = new TouringEntity({
        touringId: existingTouring.id,
        myUserBikeId: existingTouring.myUserBikeId,
        title: existingTouring.title,
        startDate: existingTouring.startDate,
        endDate,
        startMileage: existingTouring.startMileage,
        endMileage: params.endMileage ?? existingTouring.endMileage,
      })

      return await this.touringRepository.updateTouring(touring)
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  public async getTourings(
    myUserBikeId: MyUserBikeId,
    userId: UserId,
    searchParams: TouringSearchParams
  ): Promise<TouringEntity[]> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    return await this.touringRepository.findTourings(myUserBikeId, searchParams)
  }

  public async getTouringById(
    touringId: TouringId,
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<TouringEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const touring = await this.touringRepository.findTouringById(
      touringId,
      myUserBikeId
    )

    if (!touring) {
      throw new ApiV1Error('NOT_FOUND', '指定されたツーリングが見つかりません')
    }

    return touring
  }

  public async updateTouring(
    params: UpdateTouringParams
  ): Promise<TouringEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const existingTouring = await this.touringRepository.findTouringById(
      params.touringId,
      params.myUserBikeId
    )

    if (!existingTouring) {
      throw new ApiV1Error('NOT_FOUND', '指定されたツーリングが見つかりません')
    }

    try {
      const updatedTouring = new TouringEntity({
        touringId: existingTouring.id,
        myUserBikeId: existingTouring.myUserBikeId,
        title: params.title ?? existingTouring.title,
        startDate: params.startDate ?? existingTouring.startDate,
        endDate: params.endDate ?? existingTouring.endDate,
        startMileage: params.startMileage ?? existingTouring.startMileage,
        endMileage: params.endMileage ?? existingTouring.endMileage,
      })

      return await this.touringRepository.updateTouring(updatedTouring)
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }
}
