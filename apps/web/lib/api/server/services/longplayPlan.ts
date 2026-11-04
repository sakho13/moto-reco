import { createLongplayServer } from '@tinkerlandai/longplay-sdk/server'

type Plan = 'FREE' | 'PREMIUM' | null

/** Optional online Premium grant; administrator-issued plans stay authoritative. */
export async function resolveLongplayPlan(
  user: { id: string; role: string; status: string; plan: Plan },
  env: Record<string, string | undefined> = process.env,
  createClient = createLongplayServer
): Promise<Plan> {
  if (
    !env.LONGPLAY_PREMIUM_FEATURE_ID ||
    user.plan === 'PREMIUM' ||
    user.role !== 'USER' ||
    user.status !== 'ACTIVE' ||
    !user.id
  )
    return user.plan
  try {
    if (
      !env.LONGPLAY_BASE_URL ||
      !env.LONGPLAY_SECRET_KEY ||
      !env.LONGPLAY_APP_ID ||
      !['sandbox', 'live'].includes(env.LONGPLAY_ENVIRONMENT ?? '')
    )
      return user.plan
    const client = createClient({
      baseUrl: env.LONGPLAY_BASE_URL,
      apiKey: env.LONGPLAY_SECRET_KEY,
      scope: {
        projectId: env.LONGPLAY_APP_ID,
        environment: env.LONGPLAY_ENVIRONMENT as 'sandbox' | 'live',
      },
      timeoutMs: 3000,
    })
    const { customer } = await client.getOrCreateCustomer({
      externalUserId: `motoreco:user:${user.id}`,
    })
    const { check } = await client.checkEntitlement({
      customerId: customer.id,
      requirement: {
        internal_feature_id: env.LONGPLAY_PREMIUM_FEATURE_ID,
        quantity: '1',
        properties: {},
      },
    })
    return check.kind === 'access' && check.allowed ? 'PREMIUM' : user.plan
  } catch {
    // Outages cannot grant Premium or lock the user out of existing free data.
    return user.plan
  }
}
