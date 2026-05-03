import { EmailType, type EmailPayloadByType } from '../domain/email'
import type { EmailRepository } from '../interfaces/EmailRepository'
import { WelcomeEmail } from '../templates/WelcomeEmail'

export class EmailService {
  constructor(private readonly emailRepository: EmailRepository) {}

  async sendByType<T extends EmailType>(
    type: T,
    payload: EmailPayloadByType[T]
  ): Promise<void> {
    if (type === EmailType.WELCOME) {
      const message = new WelcomeEmail(payload as EmailPayloadByType['WELCOME']).build()
      await this.emailRepository.send(message)
      return
    }

    const exhaustiveCheck: never = type
    throw new Error(`Unsupported email type: ${exhaustiveCheck}`)
  }
}
