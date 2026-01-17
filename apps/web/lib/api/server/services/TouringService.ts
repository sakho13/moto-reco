import { createTouringId, MyUserBikeId, UserId } from '@repo/shared-types'
import { TouringEntity } from '../entities/TouringEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'
import { ITouringRepository } from '../interfaces/ITouringRepository'

type RegisterTouringParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  title: string
  startDate: Date
  endDate: Date
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
}
