import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookieName, verifySession } from './auth'
import { prisma } from './prisma'

export type AuthedContext = {
  userId: string
}

export async function requireUser(req: NextRequest): Promise<AuthedContext | NextResponse> {
  const token: string | undefined = req.cookies.get(getSessionCookieName())?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const session = await verifySession(token)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Ensure user exists (could have been deleted)
  const exists = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } })
  if (!exists) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return { userId: session.userId }
}

