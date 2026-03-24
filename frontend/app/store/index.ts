import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

// Slices
import authSlice from './slices/authSlice'
import projectSlice from './slices/projectSlice'
import clientSlice from './slices/clientSlice'
import escrowSlice from './slices/escrowSlice'
import reviewSlice from './slices/reviewSlice'
import contractSlice from './slices/contractSlice'

// APIs
import { authApi } from './api/authApi'
import { projectsApi } from './api/projectsApi'
import { clientsApi } from './api/clientsApi'
import { escrowApi } from './api/escrowApi'
import { contractApi } from './api/contractApi'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    projects: projectSlice,
    clients: clientSlice,
    escrow: escrowSlice,
    reviews: reviewSlice,
    contracts: contractSlice,
    // RTK Query APIs
    [authApi.reducerPath]: authApi.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [clientsApi.reducerPath]: clientsApi.reducer,
    [escrowApi.reducerPath]: escrowApi.reducer,
    [contractApi.reducerPath]: contractApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      projectsApi.middleware,
      clientsApi.middleware,
      escrowApi.middleware,
      contractApi.middleware
    ),
})

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
