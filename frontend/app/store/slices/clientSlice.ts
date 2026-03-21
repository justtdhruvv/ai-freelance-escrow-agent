import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Client {
  user_id: string
  email: string
  pfi_score: number
  trust_score: number
  created_at: string
}

interface ClientState {
  clients: Client[]
  currentClient: Client | null
  isLoading: boolean
  error: string | null
  searchTerm: string
}

const initialState: ClientState = {
  clients: [],
  currentClient: null,
  isLoading: false,
  error: null,
  searchTerm: '',
}

const clientSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setClients: (state, action: PayloadAction<Client[]>) => {
      state.clients = action.payload
      state.isLoading = false
      state.error = null
    },
    setCurrentClient: (state, action: PayloadAction<Client | null>) => {
      state.currentClient = action.payload
    },
    addClient: (state, action: PayloadAction<Client>) => {
      state.clients.unshift(action.payload)
    },
    updateClient: (state, action: PayloadAction<Client>) => {
      const index = state.clients.findIndex(c => c.user_id === action.payload.user_id)
      if (index !== -1) {
        state.clients[index] = action.payload
      }
      if (state.currentClient?.user_id === action.payload.user_id) {
        state.currentClient = action.payload
      }
    },
    deleteClient: (state, action: PayloadAction<string>) => {
      state.clients = state.clients.filter(c => c.user_id !== action.payload)
      if (state.currentClient?.user_id === action.payload) {
        state.currentClient = null
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isLoading = false
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload
    },
  },
})

export const {
  setClients,
  setCurrentClient,
  addClient,
  updateClient,
  deleteClient,
  setLoading,
  setError,
  setSearchTerm,
} = clientSlice.actions

export default clientSlice.reducer
