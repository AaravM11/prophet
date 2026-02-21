import { NextResponse } from 'next/server'
import { generateNonce, getNonceCookieName } from '@/lib/auth'

export async function GET(): Promise<NextResponse> {
  try {
    const nonce: string = generateNonce()
    const res = NextResponse.json({ nonce })
    res.cookies.set(getNonceCookieName(), nonce, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10,
      path: '/',
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
