'use client'

import { useState } from 'react'
import { useVault } from '@/hooks/useVault'
import { usePaymentStatus } from '@/hooks/usePaymentStatus'
import { FundingFlow } from '@/components/FundingFlow'
import { WithdrawalFlow } from '@/components/WithdrawalFlow'
import { PaymentStatusTracker } from '@/components/PaymentStatusTracker'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { VaultList } from '@/features/vaults'
import { VaultDetail } from '@/features/vaults'
import { CreateVault } from '@/features/vaults'
import { Vault } from '@/types'

type ViewState =
  | { type: 'list' }
  | { type: 'create' }
  | { type: 'detail'; vault: Vault }

export default function Home() {
  const { vaults } = useVault()
  const { fundingOrders, withdrawalOrders } = usePaymentStatus()
  const [view, setView] = useState<ViewState>({ type: 'list' })

  const activeOrders = [...fundingOrders, ...withdrawalOrders].filter(
    (o) => o.status !== 'completed' && o.status !== 'failed' && o.status !== 'expired'
  )

  const firstVaultId = vaults[0]?.id
  const firstVaultBalance = vaults[0]?.currentBalance ?? 0

  const handleSelectVault = (vault: Vault) => {
    setView({ type: 'detail', vault })
  }

  const handleCreateNew = () => {
    setView({ type: 'create' })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Welcome to Vaulty
          </h1>
          <p className="text-lg text-slate-600">
            Save consistently. Grow your wealth. Unlock financial opportunities.
          </p>
        </div>

        {/* Active Transactions */}
        {activeOrders.length > 0 && (
          <div className="mb-8 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Active Transactions</h2>
            {activeOrders.map((order) => (
              <PaymentStatusTracker key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* Navigation bar for vault views */}
        {view.type !== 'list' && (
          <div className="mb-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setView({ type: 'list' })}
              aria-label="Back to vault list"
            >
              &larr; All Vaults
            </Button>
          </div>
        )}

        {/* Conditional view rendering */}
        {view.type === 'create' && (
          <div className="max-w-lg mx-auto">
            <CreateVault />
          </div>
        )}

        {view.type === 'detail' && (
          <VaultDetail vault={view.vault} onBack={() => setView({ type: 'list' })} />
        )}

        {view.type === 'list' && (
          <>
            {/* Quick actions for the first vault (existing behavior preserved) */}
            {firstVaultId && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <FundingFlow vaultId={firstVaultId} />
                  <WithdrawalFlow vaultId={firstVaultId} vaultBalance={firstVaultBalance} />
                </div>
              </div>
            )}

            {/* Create vault button */}
            <div className="mb-6">
              <Button
                variant="primary"
                onClick={handleCreateNew}
                aria-label="Create a new savings vault"
              >
                + Create New Vault
              </Button>
            </div>

            {/* Vault list */}
            <VaultList onSelectVault={handleSelectVault} onCreateNew={handleCreateNew} />

            {/* Empty state when no vaults exist */}
            {!firstVaultId && vaults.length === 0 && (
              <Card>
                <p className="text-center text-slate-600">
                  Create a savings vault to get started with deposits and withdrawals.
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  )
}
