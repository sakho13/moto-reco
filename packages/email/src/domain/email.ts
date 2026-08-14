export const EmailType = {
  WELCOME: 'WELCOME',
  NOTIFICATION_EMAIL_CHANGED: 'NOTIFICATION_EMAIL_CHANGED',
  USER_QUIT: 'USER_QUIT',
} as const

export type EmailType = (typeof EmailType)[keyof typeof EmailType]

export type WelcomeEmailPayload = {
  to: string
  userName: string
}

export type NotificationEmailChangedEmailPayload = {
  to: string
  userName: string
}

export type UserQuitEmailPayload = {
  to: string
  userName: string
  /** 復帰用の平文トークン（メール本文のURLにのみ埋め込む） */
  recoveryToken: string
}

export type EmailPayloadByType = {
  [EmailType.WELCOME]: WelcomeEmailPayload
  [EmailType.NOTIFICATION_EMAIL_CHANGED]: NotificationEmailChangedEmailPayload
  [EmailType.USER_QUIT]: UserQuitEmailPayload
}

export type EmailMessage = {
  to: string
  subject: string
  html: string
}
