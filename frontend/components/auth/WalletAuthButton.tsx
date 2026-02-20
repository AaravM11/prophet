'use client'

import { useEffect, useRef } from 'react'
import { useAccount, useChainId, useSignMessage } from 'wagmi'
import { SiweMessage } from 'siwe'
import { ConnectButton } from '@rainbow-me/rainbowkit'

function createSiweMessage(address: string, statement: string, nonce: string, chainId: number): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const msg = new SiweMessage({
    domain: typeof window !== 'undefined' ? window.location.host : 'localhost',
    address,
    statement,
    uri: origin,
    version: '1',
    chainId,
    nonce,
  })
  return msg.prepareMessage()
}

export function WalletAuthButton(): JSX.Element {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { signMessageAsync } = useSignMessage()
  const inFlight = useRef(false)
  const lastSignedFor = useRef<string | null>(null)

  useEffect(() => {
    const autoSignIn = async () => {
      if (!isConnected || !address) return
      if (inFlight.current) return
      if (lastSignedFor.current === address.toLowerCase()) return
      try {
        inFlight.current = true
        // If already authenticated, skip
        const me = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' })
        const { user } = await me.json()
        if (user && user.address?.toLowerCase() === address.toLowerCase()) {
          lastSignedFor.current = address.toLowerCase()
          return
        }
        const nonceRes = await fetch('/api/auth/siwe/nonce', { method: 'GET', credentials: 'include' })
        const { nonce } = (await nonceRes.json()) as { nonce: string }
        const message = createSiweMessage(address, 'Sign in to Prophet', nonce, chainId)
        const signature = await signMessageAsync({ message })
        const verifyRes = await fetch('/api/auth/siwe/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, signature }),
          credentials: 'include',
        })
        if (!verifyRes.ok) {
          // prettier-ignore
          console.log('[auth] verify failed', await verifyRes.text())
          return
        }
        lastSignedFor.current = address.toLowerCase()
      } catch (err) {
        // prettier-ignore
        console.log('[auth] auto SIWE error', err)
      } finally {
        inFlight.current = false
      }
    }
    void autoSignIn()
  }, [isConnected, address, chainId, signMessageAsync])

  return <ConnectButton />
}

