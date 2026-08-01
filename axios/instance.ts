import { updateSession } from '@/lib/session-updater'
import axios, { InternalAxiosRequestConfig } from 'axios'
import { getSession, signOut } from 'next-auth/react'

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

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export const setAuthToken = (token?: string) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete axiosInstance.defaults.headers.common['Authorization']
  }
}

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

axiosInstance.interceptors.request.use(async (config: RequestConfigWithMetadata) => {
  config.metadata = {
    startTime: Date.now(),
    url: config.url,
    method: config.method,
  }

  // setAuthToken() (called by AuthProvider once the session resolves) covers
  // the common case, but a request fired before that resolves — e.g. a
  // page's own mount-time fetch racing the session hydration — would
  // otherwise go out with no token. Fall back to reading the session directly.
  if (!config.headers?.Authorization) {
    const session = await getSession()
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`
    }
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
    if (!error.config) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as RequestConfigWithMetadata
    const duration = originalRequest.metadata
      ? Date.now() - originalRequest.metadata.startTime
      : 0

    if (typeof window === 'undefined') {
      return Promise.reject(error)
    }

    const hadToken = Boolean(originalRequest.headers?.Authorization)

    if (error.response?.status === 401 && hadToken && !originalRequest._retry && !originalRequest._skipGlobalSignOut) {
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
        const response = await fetch(`/api/auth/refresh`, { method: 'POST' })

        if (response.ok) {
          const data = await response.json()

          if (data.access_token) {
            setAuthToken(data.access_token)
            originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`
            processQueue(null, data.access_token)

            // Persist the new tokens into the NextAuth JWT cookie too.
            updateSession({
              accessToken: data.access_token,
              ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
            })

            return axiosInstance(originalRequest)
          }
        }

        processQueue(new Error('Token refresh failed'), null)
        console.error('[Auth] Token refresh failed — redirecting to sign in')
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

export default axiosInstance
