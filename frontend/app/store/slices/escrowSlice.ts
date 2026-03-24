import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Transaction {
  id: string
  projectId: string
  projectName: string
  type: 'deposit' | 'release' | 'refund' | 'fee'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  description: string
  createdAt: string
  processedAt?: string
}

export interface EscrowAccount {
  id: string
  balance: number
  totalDeposited: number
  totalReleased: number
  totalFees: number
  currency: string
  updatedAt: string
}

interface EscrowState {
  account: EscrowAccount | null
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
}

const initialState: EscrowState = {
  account: null,
  transactions: [],
  isLoading: false,
  error: null,
}

const escrowSlice = createSlice({
  name: 'escrow',
  initialState,
  reducers: {
    setAccount: (state, action: PayloadAction<EscrowAccount>) => {
      state.account = action.payload
      state.isLoading = false
      state.error = null
    },
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload
      state.isLoading = false
      state.error = null
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload)
    },
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex(t => t.id === action.payload.id)
      if (index !== -1) {
        state.transactions[index] = action.payload
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isLoading = false
    },
    updateBalance: (state, action: PayloadAction<number>) => {
      if (state.account) {
        state.account.balance = action.payload
        state.account.updatedAt = new Date().toISOString()
      }
    },
  },
})

export const {
  setAccount,
  setTransactions,
  addTransaction,
  updateTransaction,
  setLoading,
  setError,
  updateBalance,
} = escrowSlice.actions

export default escrowSlice.reducer
