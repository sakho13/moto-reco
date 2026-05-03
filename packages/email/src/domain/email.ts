export const EmailType = {
  WELCOME: 'WELCOME',
} as const

export type EmailType = (typeof EmailType)[keyof typeof EmailType]

export type WelcomeEmailPayload = {
  to: string
  userName: string
}

export type EmailPayloadByType = {
  [EmailType.WELCOME]: WelcomeEmailPayload
}

export type EmailMessage = {
  to: string
  subject: string
  html: string
}
