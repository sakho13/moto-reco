export const EmailType = {
  WELCOME: 'WELCOME',
  NOTIFICATION_EMAIL_CHANGED: 'NOTIFICATION_EMAIL_CHANGED',
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

export type EmailPayloadByType = {
  [EmailType.WELCOME]: WelcomeEmailPayload
  [EmailType.NOTIFICATION_EMAIL_CHANGED]: NotificationEmailChangedEmailPayload
}

export type EmailMessage = {
  to: string
  subject: string
  html: string
}
