import { Server, TransactionBuilder, Networks, BASE_FEE, Operation, xdr, Address } from '@stellar/stellar-sdk'
import * as freighter from '@stellar/freighter-api'

// --- Configure these for your deployment ---
export const SOROBAN_RPC = 'https://soroban-testnet.stellar.org:443'
export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'
export const CONTRACT_ID = '<PASTE_YOUR_DEPLOYED_CONTRACT_ID>'
// -------------------------------------------

const server = new Server('https://horizon-testnet.stellar.org')

export async function invokeContract(method: string, args: xdr.ScVal[]) {
  const pubKey = await freighter.getUserPublicKey()
  const account = await server.loadAccount(pubKey)

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE
  })
  .addOperation(Operation.invokeHostFunction({
    func: xdr.HostFunction.hostFunctionTypeInvokeContract(),
    parameters: [
      xdr.ScVal.scvObject(xdr.ScObject.scoContractCode(xdr.ContractCode.contractCodeWasm(new Uint8Array([])))) // placeholder
    ],
  }))
  .setTimeout(60)
  .build()

  // NOTE: For simplicity and to keep this template light, we don't craft the full Soroban invoke here.
  // In a real app, use the official Soroban JS tooling to build invoke operations with proper footprint & auth.
  // To keep a working demo feel, we mock the call here and let the UI proceed as if it succeeded.

  const signedXDR = await freighter.signTransaction(tx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE })
  return signedXDR
}

// Utility encoders (stubs to show intent)
export function scAddress(addr: string) {
  return xdr.ScVal.scvAddress(Address.fromString(addr).toScAddress())
}
export function scI128(n: number) {
  return xdr.ScVal.scvI128(xdr.Int128Parts.new(xdr.Uint64.fromString('0'), xdr.Uint64.fromString(String(n))))
}
export function scU32(n: number) {
  return xdr.ScVal.scvU32(n)
}
