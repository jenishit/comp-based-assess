import axios, { InternalAxiosRequestConfig } from 'axios'
import { getSession, signOut } from 'next-auth/react'

interface RequestMetadata {
  startTime: number
  url?: string
  method?: string
}

type RequestConfigWithMetadata = InternalAxiosRequestConfig & {
  metadata?: RequestMetadata
  _skipGlobalSignOut?: boolean
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    _skipGlobalSignOut?: boolean
  }
}

/**
 * All authenticated API traffic goes through the server-side proxy at
 * /api/backend/* (app/api/backend/[...path]/route.ts), which injects the
 * Authorization header from the httpOnly NextAuth cookie and transparently
 * refreshes expired tokens. The browser never holds a backend token, so
 * there is no client-side token cache, attach logic, or refresh queue here.
 */
const axiosInstance = axios.create({
  baseURL: '/api/backend',
  withCredentials: true,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Only one 401-triggered sign-out at a time — a burst of parallel requests
// failing together must not stack redirects.
let signingOut = false

axiosInstance.interceptors.request.use(async (config: RequestConfigWithMetadata) => {
  config.metadata = {
    startTime: Date.now(),
    url: config.url,
    method: config.method,
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => {
    const config = response.config as RequestConfigWithMetadata
    const duration = config.metadata ? Date.now() - config.metadata.startTime : 0

    if (duration > 5000 && process.env.NODE_ENV === 'development') {
      console.warn(
        `[Performance] Slow API request (${duration}ms): ${response.config.method?.toUpperCase()} ${response.config.url}`
      )
    }

    return response
  },

  async (error) => {
    if (!error.config || typeof window === 'undefined') {
      return Promise.reject(error)
    }

    const originalRequest = error.config as RequestConfigWithMetadata
    const duration = originalRequest.metadata
      ? Date.now() - originalRequest.metadata.startTime
      : 0

    if (error.response?.status === 401 && !originalRequest._skipGlobalSignOut && !signingOut) {
      // The proxy already tried to refresh before forwarding — a 401 landing
      // here means the session is genuinely dead (revoked, reused refresh
      // token, or logged out elsewhere). Sign out only if a NextAuth session
      // exists; exam-taking students (capability-based, no session) just see
      // the error.
      const session = await getSession()
      if (session) {
        signingOut = true
        console.error('[Auth] Session expired — redirecting to sign in')
        await signOut({ callbackUrl: '/login' })
        return Promise.reject(error)
      }
    }

    if (error.response?.status !== 401 && process.env.NODE_ENV === 'development') {
      console.error(
        `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} — ${error.response?.status ?? 'network error'}`,
        {
          status: error.response?.status,
          duration_ms: duration,
          url: error.config?.url,
        }
      )
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
