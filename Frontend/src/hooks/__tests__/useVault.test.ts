/**
 * Unit tests for the useVault hook.
 *
 * Strategy:
 * - Mock the zustand store so we don't rely on real state persistence.
 * - Verify createVault, depositToVault, and withdrawFromVault behaviours including
 *   the insufficient-balance guard on withdrawal.
 */

import { renderHook, act } from '@testing-library/react'
import { useVault } from '../useVault'
import { Vault } from '@/types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/stores', () => ({
  useAppStore: jest.fn(),
}))

import { useAppStore } from '@/stores'

const mockUseAppStore = useAppStore as unknown as jest.Mock

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVault(overrides?: Partial<Vault>): Vault {
  return {
    id: 'vault-1',
    name: 'Emergency Fund',
    targetAmount: 1000,
    currentBalance: 500,
    lockPeriod: 90,
    createdAt: new Date('2024-01-01'),
    maturityDate: new Date('2024-04-01'),
    deposits: [],
    withdrawals: [],
    ...overrides,
  }
}

function buildStoreMock(vaults: Vault[] = []) {
  const setVaults = jest.fn()
  const addVault = jest.fn()
  const updateVault = jest.fn()

  return { vaults, setVaults, addVault, updateVault }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useVault', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Ensure crypto.randomUUID is available in jsdom
    if (!globalThis.crypto) {
      Object.defineProperty(globalThis, 'crypto', {
        value: { randomUUID: jest.fn(() => 'mock-uuid') },
      })
    } else if (!globalThis.crypto.randomUUID) {
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: jest.fn(() => 'mock-uuid'),
        configurable: true,
      })
    }
  })

  describe('initial state', () => {
    it('returns vaults from the store', () => {
      const vaults = [makeVault()]
      mockUseAppStore.mockReturnValue(buildStoreMock(vaults))

      const { result } = renderHook(() => useVault())

      expect(result.current.vaults).toEqual(vaults)
    })
  })

  describe('createVault()', () => {
    it('calls addVault with a new vault containing generated id, empty deposits and withdrawals', async () => {
      const storeMock = buildStoreMock()
      mockUseAppStore.mockReturnValue(storeMock)

      const { result } = renderHook(() => useVault())

      const vaultData = {
        name: 'School Fees',
        targetAmount: 2000,
        currentBalance: 0,
        lockPeriod: 180,
        createdAt: new Date('2024-06-01'),
        maturityDate: new Date('2024-12-01'),
      }

      let newVault: Vault | undefined
      await act(async () => {
        newVault = await result.current.createVault(vaultData)
      })

      expect(storeMock.addVault).toHaveBeenCalledTimes(1)
      const added = storeMock.addVault.mock.calls[0][0] as Vault
      expect(added.name).toBe('School Fees')
      expect(added.deposits).toEqual([])
      expect(added.withdrawals).toEqual([])
      expect(typeof added.id).toBe('string')
      // returned value matches what was passed to addVault
      expect(newVault).toEqual(added)
    })
  })

  describe('depositToVault()', () => {
    it('calls updateVault with increased balance', async () => {
      const vault = makeVault({ id: 'vault-1', currentBalance: 500 })
      const storeMock = buildStoreMock([vault])
      mockUseAppStore.mockReturnValue(storeMock)

      const { result } = renderHook(() => useVault())

      await act(async () => {
        await result.current.depositToVault('vault-1', 250)
      })

      expect(storeMock.updateVault).toHaveBeenCalledWith('vault-1', {
        currentBalance: 750,
      })
    })

    it('treats missing vault balance as 0 and still adds the deposit amount', async () => {
      // vault not found in store → currentBalance lookup returns undefined
      const storeMock = buildStoreMock([]) // empty vaults list
      mockUseAppStore.mockReturnValue(storeMock)

      const { result } = renderHook(() => useVault())

      await act(async () => {
        await result.current.depositToVault('nonexistent', 100)
      })

      expect(storeMock.updateVault).toHaveBeenCalledWith('nonexistent', {
        currentBalance: 100,
      })
    })
  })

  describe('withdrawFromVault()', () => {
    it('calls updateVault with decreased balance when funds are sufficient', async () => {
      const vault = makeVault({ id: 'vault-1', currentBalance: 500 })
      const storeMock = buildStoreMock([vault])
      mockUseAppStore.mockReturnValue(storeMock)

      const { result } = renderHook(() => useVault())

      await act(async () => {
        await result.current.withdrawFromVault('vault-1', 200)
      })

      expect(storeMock.updateVault).toHaveBeenCalledWith('vault-1', {
        currentBalance: 300,
      })
    })

    it('does NOT call updateVault when withdrawal exceeds balance (insufficient funds guard)', async () => {
      const vault = makeVault({ id: 'vault-1', currentBalance: 100 })
      const storeMock = buildStoreMock([vault])
      mockUseAppStore.mockReturnValue(storeMock)

      const { result } = renderHook(() => useVault())

      await act(async () => {
        await result.current.withdrawFromVault('vault-1', 500)
      })

      expect(storeMock.updateVault).not.toHaveBeenCalled()
    })

    it('does NOT call updateVault when vault id does not exist', async () => {
      const storeMock = buildStoreMock([])
      mockUseAppStore.mockReturnValue(storeMock)

      const { result } = renderHook(() => useVault())

      await act(async () => {
        await result.current.withdrawFromVault('nonexistent', 100)
      })

      expect(storeMock.updateVault).not.toHaveBeenCalled()
    })
  })
})
