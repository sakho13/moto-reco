import type { NextAdminOptions } from '@premieroctet/next-admin'

export const options: NextAdminOptions = {
  title: 'MotoReco Admin',
  model: {
    MUser: {
      toString: (user) => user.name,
      title: 'ユーザー',
      icon: 'UsersIcon',
      list: {
        display: ['id', 'name', 'status', 'role', 'createdAt'],
      },
      edit: {
        display: ['id', 'name', 'status', 'role', 'createdAt', 'updatedAt'],
      },
    },
    MAuthProvider: {
      title: '認証プロバイダー',
      icon: 'KeyIcon',
      list: {
        display: ['id', 'userId', 'providerType', 'externalId', 'isActive'],
      },
    },
    MManufacturer: {
      toString: (manufacturer) => manufacturer.name,
      title: 'メーカー',
      icon: 'BuildingOfficeIcon',
      list: {
        display: ['id', 'name', 'nameEn', 'country', 'isActive'],
      },
      edit: {
        display: [
          'id',
          'name',
          'nameEn',
          'logoUrl',
          'websiteUrl',
          'country',
          'isActive',
        ],
      },
    },
    MBike: {
      toString: (bike) => bike.modelName,
      title: 'バイク',
      icon: 'TruckIcon',
      list: {
        display: [
          'id',
          'manufacturer',
          'modelName',
          'displacement',
          'modelYear',
          'settingStatus',
        ],
      },
      edit: {
        display: [
          'id',
          'manufacturer',
          'modelName',
          'displacement',
          'modelYear',
          'modelCode',
          'releaseYear',
          'releaseMonth',
          'settingStatus',
        ],
      },
    },
    MMaintenanceType: {
      title: 'メンテナンス種別',
      icon: 'WrenchIcon',
      list: {
        display: ['id', 'bike', 'type', 'recommendedMileage', 'recommendedPeriod'],
      },
    },
    TUserBike: {
      title: 'ユーザーバイク',
      icon: 'IdentificationIcon',
      list: {
        display: ['id', 'bike', 'serialNumber', 'createdAt'],
      },
    },
    TUserMyBike: {
      title: 'マイバイク',
      icon: 'HeartIcon',
      list: {
        display: ['id', 'user', 'nickname', 'totalMileage', 'ownStatus'],
      },
    },
    TUserMyBikeFuelLog: {
      title: '給油記録',
      icon: 'FireIcon',
      list: {
        display: ['id', 'userMyBike', 'amount', 'price', 'mileage', 'refueledAt'],
      },
    },
  },
}
