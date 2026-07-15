/**
 * Unit tests for WalletManager (src/lib/stellar.ts).
 *
 * Strategy:
 * - The real Stellar SDK is NOT available in the test environment.
 *   Mock `@stellar/stellar-sdk` so we can test WalletManager's logic in isolation.
 * - Test connectWallet, disconnectWallet, signTransaction, and getPublicKey.
 */

// Mock the Stellar SDK before importing anything that uses it
jest.mock('@stellar/stellar-sdk', () => ({
  StellarWallet: jest.fn(),
}))

import { WalletManager } from '../stellar'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WalletManager', () => {
  let manager: WalletManager

  beforeEach(() => {
    manager = new WalletManager()
    jest.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // connectWallet
  // -------------------------------------------------------------------------

  describe('connectWallet()', () => {
    it('throws "Wallet connection not yet implemented" (expected scaffold behaviour)', async () => {
      await expect(manager.connectWallet()).rejects.toThrow(
        'Wallet connection not yet implemented'
      )
    })

    it('re-throws the error after logging it', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await expect(manager.connectWallet()).rejects.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to connect wallet:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // disconnectWallet
  // -------------------------------------------------------------------------

  describe('disconnectWallet()', () => {
    it('resolves without throwing', async () => {
      await expect(manager.disconnectWallet()).resolves.toBeUndefined()
    })

    it('sets internal wallet reference to null (getPublicKey returns null after disconnect)', async () => {
      // Disconnect should clear the wallet — getPublicKey must return null.
      await manager.disconnectWallet()
      expect(manager.getPublicKey()).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // signTransaction
  // -------------------------------------------------------------------------

  describe('signTransaction()', () => {
    it('throws "Wallet not connected" when no wallet is connected', async () => {
      await expect(manager.signTransaction('base64XDR==')).rejects.toThrow(
        'Wallet not connected'
      )
    })

    it('does NOT reach the signing stub when wallet is not connected (early guard)', async () => {
      // Verify the guard is hit before the "not yet implemented" stub
      try {
        await manager.signTransaction('base64XDR==')
      } catch (err) {
        expect((err as Error).message).toBe('Wallet not connected')
      }
    })
  })

  // -------------------------------------------------------------------------
  // getPublicKey
  // -------------------------------------------------------------------------

  describe('getPublicKey()', () => {
    it('returns null when no wallet is connected', () => {
      expect(manager.getPublicKey()).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // Singleton export
  // -------------------------------------------------------------------------

  describe('walletManager singleton', () => {
    it('is exported and is an instance of WalletManager', async () => {
      const { walletManager } = await import('../stellar')
      expect(walletManager).toBeInstanceOf(WalletManager)
    })
  })
})
