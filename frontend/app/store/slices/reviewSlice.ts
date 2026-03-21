import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AIReview {
  id: string
  projectId: string
  freelancerId: string
  clientId: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  trustScore: number
  recommendations: string[]
  analysis: {
    communicationScore: number
    qualityScore: number
    timelinessScore: number
    overallScore: number
  }
  createdAt: string
  updatedAt: string
}

export interface ReviewMetrics {
  totalReviews: number
  averageRiskScore: number
  averageTrustScore: number
  riskDistribution: {
    low: number
    medium: number
    high: number
  }
  monthlyTrends: {
    month: string
    riskScore: number
    trustScore: number
  }[]
}

interface ReviewState {
  reviews: AIReview[]
  currentReview: AIReview | null
  metrics: ReviewMetrics | null
  isLoading: boolean
  error: string | null
}

const initialState: ReviewState = {
  reviews: [],
  currentReview: null,
  metrics: null,
  isLoading: false,
  error: null,
}

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    setReviews: (state, action: PayloadAction<AIReview[]>) => {
      state.reviews = action.payload
      state.isLoading = false
      state.error = null
    },
    setCurrentReview: (state, action: PayloadAction<AIReview | null>) => {
      state.currentReview = action.payload
    },
    setMetrics: (state, action: PayloadAction<ReviewMetrics>) => {
      state.metrics = action.payload
      state.isLoading = false
      state.error = null
    },
    addReview: (state, action: PayloadAction<AIReview>) => {
      state.reviews.unshift(action.payload)
    },
    updateReview: (state, action: PayloadAction<AIReview>) => {
      const index = state.reviews.findIndex(r => r.id === action.payload.id)
      if (index !== -1) {
        state.reviews[index] = action.payload
      }
      if (state.currentReview?.id === action.payload.id) {
        state.currentReview = action.payload
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
  setReviews,
  setCurrentReview,
  setMetrics,
  addReview,
  updateReview,
  setLoading,
  setError,
} = reviewSlice.actions

export default reviewSlice.reducer
