import { createClient } from 'microcms-js-sdk'

const config = {
  serviceDomain: process.env.MICRO_CMS_SERVICE_DOMAIN,
  apiKey: process.env.MICRO_CMS_API_KEY,
}

function getClient() {
  if (!config.apiKey || !config.serviceDomain) {
    console.warn('[debug] MicroCMS config is empty')
    return null
  }
  return createClient({
    serviceDomain: config.serviceDomain,
    apiKey: config.apiKey,
  })
}

export const microCMSClient = getClient()
