import type { EmailMessage } from '../domain/email'
import type { EmailRepository } from '../interfaces/EmailRepository'

export class ResendEmailRepository implements EmailRepository {
  constructor(
    private readonly apiKey: string | undefined,
    private readonly from: string = 'MotoReco <no-reply@motoreco.app>'
  ) {}

  async send(email: EmailMessage): Promise<void> {
    if (!this.apiKey || this.apiKey === 'dummy') return

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [email.to],
        subject: email.subject,
        html: email.html,
      }),
    })
  }
}
