import { cookies } from 'next/headers'
import { SignJWT, jwtVerify, JWTPayload } from 'jose'
import { nanoid } from 'nanoid'
import { NextRequest } from 'next/server'

const SESSION_COOKIE = 'prophet_session'
const NONCE_COOKIE = 'siwe_nonce'

const getSecret = (): Uint8Array => {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'dev-insecure-secret-change-me'
  return new TextEncoder().encode(secret)
}

export type Session = {
  userId: string
  address: string
}

export function generateNonce(): string {
  return nanoid(24)
}

export async function createSession(payload: Session, maxAgeSeconds = 60 * 60 * 24 * 7): Promise<string> {
  const jwt = await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
    .sign(getSecret())
  return jwt
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
    return { userId: String(payload.userId), address: String(payload.address) }
  } catch {
    return null
  }
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE
}

export function getNonceCookieName(): string {
  return NONCE_COOKIE
}

export function setHttpOnlyCookie(name: string, value: string, options?: { maxAge?: number; path?: string }) {
  const store = cookies()
  store.set(name, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: options?.maxAge ?? 60 * 10,
    path: options?.path ?? '/',
  })
}

export function clearCookie(name: string) {
  const store = cookies()
  store.set(name, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/',
  })
}

export function readSessionFromRequest(req: NextRequest): string | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  return token ?? null
}

