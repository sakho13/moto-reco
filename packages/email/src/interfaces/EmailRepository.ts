import type { EmailMessage } from '../domain/email'

export interface EmailRepository {
  send(email: EmailMessage): Promise<void>
}
