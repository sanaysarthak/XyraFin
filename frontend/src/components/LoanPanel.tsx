import React, { useState } from 'react'
import { invokeContract } from '../lib/soroban'

export default function LoanPanel({ publicKey }: { publicKey: string }) {
  const [amount, setAmount] = useState<number>(100)
  const [interest, setInterest] = useState<number>(500)
  const [token, setToken] = useState<string>('TOKEN_CONTRACT_ID')
  const [ai, setAi] = useState<any>(null)
  const [fraud, setFraud] = useState<any>(null)
  const [log, setLog] = useState<string>('')

  const backend = 'http://localhost:8787'

  const checkAI = async () => {
    const score = await fetch(backend + '/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthly_income: 600, expenses_ratio: 0.4, tx_count_90d: 22,
        onchain_age_days: 120, avg_tx_amount: 50, country_risk: 0.2, existing_debt: 0
      })
    }).then(r => r.json())
    const fraud = await fetch(backend + '/fraud', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip_country: 'IN', device_changes_30d: 1, velocity_last_24h: 2, failed_auth_7d: 0 })
    }).then(r => r.json())
    setAi(score); setFraud(fraud)
  }

  const requestLoan = async () => {
    setLog('Requesting loan via Soroban... (mock invoke)')
    try {
      await invokeContract('request_loan', [])
      setLog(prev => prev + '\nSuccess: loan requested. (Replace with real soroban invoke)')
    } catch (e) {
      console.error(e)
      setLog('Error: ' + (e as any).message)
    }
  }

  const approveLoan = async () => {
    setLog('Approving loan via Soroban... (mock invoke)')
    try {
      await invokeContract('approve_loan', [])
      setLog(prev => prev + '\nSuccess: loan approved. (Replace with real soroban invoke)')
    } catch (e) {
      console.error(e)
      setLog('Error: ' + (e as any).message)
    }
  }

  const repayLoan = async () => {
    setLog('Repaying loan via Soroban... (mock invoke)')
    try {
      await invokeContract('repay_loan', [])
      setLog(prev => prev + '\nSuccess: repayment submitted. (Replace with real soroban invoke)')
    } catch (e) {
      console.error(e)
      setLog('Error: ' + (e as any).message)
    }
  }

  return (
    <div style={{ border: '1px solid #eee', padding: 16, borderRadius: 12 }}>
      <h3>Loan Console</h3>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
        <label>Amount (principal)
          <input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value||'0'))} />
        </label>
        <label>Interest (bps)
          <input type="number" value={interest} onChange={e => setInterest(parseInt(e.target.value||'0'))} />
        </label>
        <label>Token
          <input value={token} onChange={e => setToken(e.target.value)} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button onClick={checkAI}>Run AI checks</button>
        <button onClick={requestLoan}>Request Loan</button>
        <button onClick={approveLoan}>Approve Loan</button>
        <button onClick={repayLoan}>Repay</button>
      </div>

      {ai && (
        <div style={{ marginTop: 12, padding: 10, background: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: 8 }}>
          <strong>AI Score:</strong> {ai.score} ({ai.recommendation})
        </div>
      )}
      {fraud && (
        <div style={{ marginTop: 8, padding: 10, background: '#fffaf0', border: '1px solid #fefcbf', borderRadius: 8 }}>
          <strong>Fraud Risk:</strong> {fraud.risk} {fraud.flags?.length ? `- Flags: ${fraud.flags.join(', ')}` : ''}
        </div>
      )}
      {log && (
        <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12, background: '#f7f7f7', padding: 10, borderRadius: 8 }}>{log}</pre>
      )}
    </div>
  )
}
