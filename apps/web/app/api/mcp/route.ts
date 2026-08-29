import { handle } from 'hono/vercel'
import { mcpApp } from '@/lib/api/server/mcpApp'

export const POST = handle(mcpApp)
