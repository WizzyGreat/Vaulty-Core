'use client'

import { useState } from 'react'
import { useVault } from '@/hooks/useVault'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'

const LOCK_PERIOD_OPTIONS = [
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '180 days' },
  { value: 365, label: '365 days' },
] as const

interface FormErrors {
  name?: string
  targetAmount?: string
  lockPeriod?: string
}

export default function CreateVault() {
  const { createVault, isProcessing, error } = useVault()
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [lockPeriod, setLockPeriod] = useState<number>(90)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [success, setSuccess] = useState(false)

  const validate = (): boolean => {
    const errors: FormErrors = {}

    const trimmedName = name.trim()
    if (!trimmedName) {
      errors.name = 'Vault name is required'
    } else if (trimmedName.length < 2) {
      errors.name = 'Vault name must be at least 2 characters'
    } else if (trimmedName.length > 50) {
      errors.name = 'Vault name must be 50 characters or less'
    }

    const parsedTarget = parseFloat(targetAmount)
    if (!targetAmount || isNaN(parsedTarget)) {
      errors.targetAmount = 'Please enter a valid target amount'
    } else if (parsedTarget < 100) {
      errors.targetAmount = 'Minimum target amount is 100'
    } else if (parsedTarget > 100_000_000) {
      errors.targetAmount = 'Maximum target amount is 100,000,000'
    }

    if (!lockPeriod || lockPeriod < 1) {
      errors.lockPeriod = 'Please select a lock period'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    if (!validate()) return

    const now = new Date()
    const maturityDate = new Date(now)
    maturityDate.setDate(maturityDate.getDate() + lockPeriod)

    await createVault({
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      currentBalance: 0,
      lockPeriod,
      createdAt: now,
      maturityDate,
    })

    setName('')
    setTargetAmount('')
    setLockPeriod(90)
    setFormErrors({})
    setSuccess(true)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <h2 className="text-2xl font-bold text-slate-900" id="create-vault-heading">
          Create New Vault
        </h2>
        <p className="text-sm text-slate-600">
          Set up a new savings vault with a target amount and lock period.
        </p>

        {success && (
          <div
            className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700"
            role="alert"
            aria-live="polite"
          >
            Vault created successfully! You can now fund it from the dashboard.
          </div>
        )}

        <Input
          label="Vault Name"
          id="vault-name"
          type="text"
          placeholder="e.g. Emergency Fund, School Fees"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }))
          }}
          error={formErrors.name}
          aria-describedby={formErrors.name ? 'vault-name-error' : undefined}
          aria-required="true"
          maxLength={50}
        />

        <Input
          label="Target Amount"
          id="vault-target"
          type="number"
          placeholder="e.g. 500000"
          value={targetAmount}
          onChange={(e) => {
            setTargetAmount(e.target.value)
            if (formErrors.targetAmount) setFormErrors((prev) => ({ ...prev, targetAmount: undefined }))
          }}
          error={formErrors.targetAmount}
          aria-describedby={formErrors.targetAmount ? 'vault-target-error' : undefined}
          aria-required="true"
          min={100}
          step="any"
        />

        <div className="w-full">
          <label
            htmlFor="vault-lock-period"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Lock Period
          </label>
          <select
            id="vault-lock-period"
            value={lockPeriod}
            onChange={(e) => {
              setLockPeriod(parseInt(e.target.value, 10))
              if (formErrors.lockPeriod) setFormErrors((prev) => ({ ...prev, lockPeriod: undefined }))
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              formErrors.lockPeriod ? 'border-red-500' : 'border-slate-300'
            }`}
            aria-required="true"
            aria-describedby={formErrors.lockPeriod ? 'vault-lock-period-error' : undefined}
          >
            {LOCK_PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {formErrors.lockPeriod && (
            <p id="vault-lock-period-error" className="mt-1 text-sm text-red-600" role="alert">
              {formErrors.lockPeriod}
            </p>
          )}
        </div>

        {error && (
          <div
            className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <Button type="submit" isLoading={isProcessing} className="w-full">
          Create Vault
        </Button>
      </form>
    </Card>
  )
}
