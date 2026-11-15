import { createHash } from 'crypto'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  ApiV1Error,
  INotificationEmailVerificationRepository,
  IUserRepository,
  NotificationEmailVerificationEntity,
  UserEntity,
} from '@repo/shared-domain'
import {
  createNotificationEmailVerificationId,
  createUserId,
} from '@repo/shared-types'
import {
  NOTIFICATION_EMAIL_VERIFICATION_RATE_LIMITS,
  NotificationEmailVerificationService,
} from '@/lib/api/server/services/NotificationEmailVerificationService'

const userId = createUserId('user-1')
const NOW = new Date('2026-11-15T00:00:00.000Z')

const buildVerification = (
  overrides: Partial<{
    expiresAt: Date
    verifiedAt: Date | null
    revokedAt: Date | null
  }> = {}
) =>
  new NotificationEmailVerificationEntity({
    id: createNotificationEmailVerificationId('v-1'),
    userId,
    email: 'new@example.com',
    tokenHash: createHash('sha256').update('plain-token').digest('hex'),
    expiresAt: new Date(NOW.getTime() + 60_000),
    verifiedAt: null,
    revokedAt: null,
    createdAt: NOW,
    ...overrides,
  })

const errorCodeOf = (error: unknown): string | undefined =>
  error instanceof ApiV1Error ? error.toErrorResponse().errorCode : undefined

describe('NotificationEmailVerificationService', () => {
  let verificationRepository: INotificationEmailVerificationRepository
  let userRepository: IUserRepository
  let service: NotificationEmailVerificationService
  let user: UserEntity

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)

    user = new UserEntity(
      {
        id: userId,
        name: 'テストユーザー',
        role: 'USER',
        status: 'ACTIVE',
        notificationEmail: 'old@example.com',
        isProfilePublic: false,
      },
      null
    )
    verificationRepository = {
      create: vi.fn().mockImplementation(async (v) => v),
      findByTokenHash: vi.fn().mockResolvedValue(buildVerification()),
      findLatestUsableByUserId: vi.fn().mockResolvedValue(null),
      countCreatedSince: vi.fn().mockResolvedValue(0),
      revokePendingByUserId: vi.fn(),
      markVerified: vi.fn().mockResolvedValue(true),
    }
    userRepository = {
      findById: vi.fn().mockResolvedValue(user),
      updateUser: vi.fn().mockImplementation(async (u) => u),
    } as unknown as IUserRepository
    service = new NotificationEmailVerificationService(
      verificationRepository,
      userRepository
    )
  })

  describe('requestChange', () => {
    test('確認待ちを無効化してから、ハッシュ化したトークンを保存する', async () => {
      const result = await service.requestChange(userId, 'new@example.com')

      expect(verificationRepository.revokePendingByUserId).toHaveBeenCalled()
      const saved = vi.mocked(verificationRepository.create).mock
        .calls[0]![0] as NotificationEmailVerificationEntity
      expect(saved.tokenHash).toBe(
        createHash('sha256').update(result.token).digest('hex')
      )
      expect(saved.tokenHash).not.toBe(result.token)
      expect(saved.expiresAt.getTime()).toBe(NOW.getTime() + 86_400_000)
    })

    test.each(NOTIFICATION_EMAIL_VERIFICATION_RATE_LIMITS)(
      '直近$windowMsミリ秒で$max件発行済みの場合はTOO_MANY_REQUESTSになる',
      async ({ windowMs, max }) => {
        vi.mocked(verificationRepository.countCreatedSince).mockImplementation(
          async (_, since) =>
            since.getTime() === NOW.getTime() - windowMs ? max : 0
        )

        const error = await service
          .requestChange(userId, 'new@example.com')
          .catch((e: unknown) => e)

        expect(errorCodeOf(error)).toBe('TOO_MANY_REQUESTS')
        expect(verificationRepository.create).not.toHaveBeenCalled()
      }
    )
  })

  describe('verify', () => {
    test('有効なトークンで通知メールアドレスを確定する', async () => {
      const result = await service.verify('plain-token')

      expect(result.notificationEmail).toBe('new@example.com')
      expect(user.notificationEmail).toBe('new@example.com')
      expect(userRepository.updateUser).toHaveBeenCalledWith(user)
    })

    test.each([
      ['有効期限切れ', { expiresAt: new Date(NOW.getTime() - 1) }],
      ['確認済み', { verifiedAt: NOW }],
      ['無効化済み', { revokedAt: NOW }],
    ])('%sのトークンはINVALID_REQUESTになる', async (_, overrides) => {
      vi.mocked(verificationRepository.findByTokenHash).mockResolvedValue(
        buildVerification(overrides)
      )

      const error = await service.verify('plain-token').catch((e: unknown) => e)

      expect(errorCodeOf(error)).toBe('INVALID_REQUEST')
      expect(userRepository.updateUser).not.toHaveBeenCalled()
    })

    test('同時に確認され既に確認済みにされていた場合はINVALID_REQUESTになる', async () => {
      vi.mocked(verificationRepository.markVerified).mockResolvedValue(false)

      const error = await service.verify('plain-token').catch((e: unknown) => e)

      expect(errorCodeOf(error)).toBe('INVALID_REQUEST')
      expect(userRepository.updateUser).not.toHaveBeenCalled()
    })
  })
})
