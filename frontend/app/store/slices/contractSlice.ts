import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface VerificationContract {
  id: string
  project_id: string
  client_approved: boolean
  freelancer_approved: boolean
  locked: boolean
  created_at: string
  updated_at: string
}

interface ContractState {
  contracts: VerificationContract[]
  currentContract: VerificationContract | null
  isLoading: boolean
  error: string | null
}

const initialState: ContractState = {
  contracts: [],
  currentContract: null,
  isLoading: false,
  error: null,
}

const contractSlice = createSlice({
  name: 'contracts',
  initialState,
  reducers: {
    setContracts: (state, action: PayloadAction<VerificationContract[]>) => {
      state.contracts = action.payload
      state.isLoading = false
      state.error = null
    },
    setCurrentContract: (state, action: PayloadAction<VerificationContract | null>) => {
      state.currentContract = action.payload
    },
    addContract: (state, action: PayloadAction<VerificationContract>) => {
      state.contracts.unshift(action.payload)
    },
    updateContract: (state, action: PayloadAction<VerificationContract>) => {
      const index = state.contracts.findIndex(c => c.id === action.payload.id)
      if (index !== -1) {
        state.contracts[index] = action.payload
      }
      if (state.currentContract?.id === action.payload.id) {
        state.currentContract = action.payload
      }
    },
    approveClientContract: (state, action: PayloadAction<string>) => {
      const contractId = action.payload
      const index = state.contracts.findIndex(c => c.id === contractId)
      if (index !== -1) {
        state.contracts[index].client_approved = true
      }
      if (state.currentContract?.id === contractId) {
        state.currentContract.client_approved = true
      }
    },
    approveFreelancerContract: (state, action: PayloadAction<string>) => {
      const contractId = action.payload
      const index = state.contracts.findIndex(c => c.id === contractId)
      if (index !== -1) {
        state.contracts[index].freelancer_approved = true
      }
      if (state.currentContract?.id === contractId) {
        state.currentContract.freelancer_approved = true
      }
    },
    lockContract: (state, action: PayloadAction<string>) => {
      const contractId = action.payload
      const index = state.contracts.findIndex(c => c.id === contractId)
      if (index !== -1) {
        state.contracts[index].locked = true
      }
      if (state.currentContract?.id === contractId) {
        state.currentContract.locked = true
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isLoading = false
    },
  },
})

export const {
  setContracts,
  setCurrentContract,
  addContract,
  updateContract,
  approveClientContract,
  approveFreelancerContract,
  lockContract,
  setLoading,
  setError,
} = contractSlice.actions

export default contractSlice.reducer
