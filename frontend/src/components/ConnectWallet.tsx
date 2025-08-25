import React, { useEffect, useState } from 'react'
import * as freighter from '@stellar/freighter-api'

export default function ConnectWallet({ onConnected }: { onConnected: (pubKey: string) => void }) {
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState<string>('')

  const connect = async () => {
    const isInstalled = await freighter.isConnected()
    if (!isInstalled) {
      alert('Please install the Freighter wallet extension.')
      return
    }
    const pubKey = await freighter.getUserPublicKey()
    setAddress(pubKey)
    setConnected(true)
    onConnected(pubKey)
  }

  useEffect(() => { (async () => {
    if (await freighter.isConnected()) {
      try {
        const pubKey = await freighter.getUserPublicKey()
        setAddress(pubKey); setConnected(true); onConnected(pubKey)
      } catch {}
    }
  })() }, [])

  return (
    <div style={{ margin: '16px 0' }}>
      {!connected ? (
        <button onClick={connect} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}>
          Connect Freighter
        </button>
      ) : (
        <div style={{ padding: 8, background: '#f7f7f7', borderRadius: 8, border: '1px solid #eee' }}>
          Connected: <code>{address}</code>
        </div>
      )}
    </div>
  )
}
