export const EmailType = {
  WELCOME: 'WELCOME',
  NOTIFICATION_EMAIL_VERIFICATION: 'NOTIFICATION_EMAIL_VERIFICATION',
  USER_QUIT: 'USER_QUIT',
} as const

export type EmailType = (typeof EmailType)[keyof typeof EmailType]

export type WelcomeEmailPayload = {
  to: string
  userName: string
}

export type NotificationEmailVerificationEmailPayload = {
  /** 所有確認を行う（確認待ちの）メールアドレス */
  to: string
  /** 確認用の平文トークン（メール本文のURLにのみ埋め込む） */
  token: string
}

export type UserQuitEmailPayload = {
  to: string
  userName: string
  /** 復帰用の平文トークン（メール本文のURLにのみ埋め込む） */
  recoveryToken: string
}

export type EmailPayloadByType = {
  [EmailType.WELCOME]: WelcomeEmailPayload
  [EmailType.NOTIFICATION_EMAIL_VERIFICATION]: NotificationEmailVerificationEmailPayload
  [EmailType.USER_QUIT]: UserQuitEmailPayload
}

export type EmailMessage = {
  to: string
  subject: string
  html: string
}
