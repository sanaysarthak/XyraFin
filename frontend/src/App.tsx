import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import LoanPanel from './components/LoanPanel'

export default function App() {
  const [pubKey, setPubKey] = useState<string>('')

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>StellAI – AI-Powered Microfinance</h1>
      <p>Demo: AI scoring + Soroban microloans on Stellar Testnet</p>
      <ConnectWallet onConnected={setPubKey} />
      {pubKey && <LoanPanel publicKey={pubKey} />}
      <footer style={{ marginTop: 40, opacity: 0.7 }}>
        <small>Note: This is a hackathon demo; do not use on mainnet.</small>
      </footer>
    </div>
  )
}
