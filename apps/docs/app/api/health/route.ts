import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      status: 'success',
      message: 'Docs API is healthy',
      service: 'docs',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}
