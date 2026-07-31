import { updateSession } from '@/lib/session-updater'
import axios, { InternalAxiosRequestConfig } from 'axios'
import { getSession, signOut } from 'next-auth/react'

// ============ TYPE DEFINITIONS ============
interface RequestMetadata {
  startTime: number
  url?: string
  method?: string
}

type RequestConfigWithMetadata = InternalAxiosRequestConfig & {
  metadata?: RequestMetadata
  _retry?: boolean
  _skipGlobalSignOut?: boolean
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    _skipGlobalSignOut?: boolean
  }
}

// ============ AXIOS INSTANCE ============
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// ============ TOKEN MANAGEMENT ============
export const setAuthToken = (token?: string) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete axiosInstance.defaults.headers.common['Authorization']
  }
}

// ============ REQUEST QUEUE FOR REFRESH ============
interface QueueItem {
  resolve: (value: string | null) => void
  reject: (reason?: unknown) => void
}

let isRefreshing = false
let failedQueue: QueueItem[] = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// ============ REQUEST INTERCEPTOR ============
axiosInstance.interceptors.request.use(async (config: RequestConfigWithMetadata) => {
  // Add timing metadata for performance tracking
  config.metadata = {
    startTime: Date.now(),
    url: config.url,
    method: config.method,
  }

  // setAuthToken() (called by AuthProvider once the session resolves) sets the
  // Authorization default for the common case. But any request fired before
  // that resolves — e.g. a page's own mount-time fetch racing ahead of the
  // session hydration — would otherwise go out with no token at all. Fall
  // back to reading the session directly so it's never actually missing.
  if (!config.headers?.Authorization) {
    const session = await getSession()
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`
    }
  }

  return config
})

// ============ RESPONSE INTERCEPTOR ============
axiosInstance.interceptors.response.use(
  // Success handler
  (response) => {
    const config = response.config as RequestConfigWithMetadata
    const duration = config.metadata ? Date.now() - config.metadata.startTime : 0

    // Log slow requests in development
    if (duration > 5000 && process.env.NODE_ENV === 'development') {
      console.warn(
        `[Performance] Slow API request (${duration}ms): ${response.config.method?.toUpperCase()} ${response.config.url}`
      )
    }

    return response
  },

  // Error handler
  async (error) => {
    // Guard: some network errors carry no config
    if (!error.config) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as RequestConfigWithMetadata
    const duration = originalRequest.metadata
      ? Date.now() - originalRequest.metadata.startTime
      : 0

    // Only run token refresh logic client-side
    if (typeof window === 'undefined') {
      return Promise.reject(error)
    }

    // Check if request had a token (for 401 handling)
    const hadToken = Boolean(originalRequest.headers?.Authorization)

    // ============ 401 HANDLING WITH TOKEN REFRESH ============
    if (error.response?.status === 401 && hadToken && !originalRequest._retry && !originalRequest._skipGlobalSignOut) {
      
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Attempt token refresh
        const response = await fetch(`/api/auth/refresh`, { method: 'POST' })

        if (response.ok) {
          const data = await response.json()

          if (data.access_token) {
            // Update token in axios instance
            setAuthToken(data.access_token)
            originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`
            
            // Process queued requests
            processQueue(null, data.access_token)

            // Persist new tokens into NextAuth JWT cookie
            updateSession({
              accessToken: data.access_token,
              ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
            })

            // Retry the original request
            return axiosInstance(originalRequest)
          }
        }

        // Refresh failed
        processQueue(new Error('Token refresh failed'), null)
        console.error('[Auth] Token refresh failed — redirecting to sign in')

        // Sign out user
        await signOut({ callbackUrl: '/login' })
        return Promise.reject(error)

      } catch (refreshError) {
        processQueue(refreshError as Error, null)
        console.error('[Auth] Token refresh error:', refreshError)

        await signOut({ callbackUrl: '/login' })
        return Promise.reject(refreshError)

      } finally {
        isRefreshing = false
      }
    }

    // ============ LOG NON-401 ERRORS ============
    if (error.response?.status !== 401) {
      if (process.env.NODE_ENV === 'development') {
        console.error(
          `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} — ${error.response?.status ?? 'network error'}`,
          {
            status: error.response?.status,
            duration_ms: duration,
            url: error.config?.url,
          }
        )
      }
    }

    return Promise.reject(error)
  }
)

// ============ SSR SUPPORT ============
export const createAxiosInstanceWithToken = (token?: string) => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    withCredentials: true,
    timeout: 30000,
    headers,
  })
}

// ============ EXPORTS ============
export default axiosInstance