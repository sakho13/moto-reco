import { Resend } from 'resend'
import type { EmailMessage } from '../domain/email'
import type { EmailRepository } from '../interfaces/EmailRepository'

export class ResendEmailRepository implements EmailRepository {
  private readonly _client: Resend | null

  constructor(
    apiKey: string | undefined,
    private readonly _from: string = 'MotoReco <no-reply@moto-reco.com>'
  ) {
    this._client = apiKey && apiKey !== 'dummy' ? new Resend(apiKey) : null
  }

  async send(email: EmailMessage): Promise<void> {
    if (!this._client) return

    const { error } = await this._client.emails.send({
      from: this._from,
      to: [email.to],
      subject: email.subject,
      html: email.html,
    })

    if (error) throw new Error(error.message)
  }
}
