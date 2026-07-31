/**
 * Session Updater
 *
 * Bridges the NextAuth `update()` function (only available inside React components)
 * with non-component code like the axios interceptor.
 *
 * Usage:
 *   - SessionSync registers the function once on mount via `setSessionUpdater`
 *   - The axios interceptor calls `updateSession` after a successful token refresh
 */

type UpdateFn = (data?: Record<string, unknown>) => Promise<unknown>

let _update: UpdateFn | null = null

export const setSessionUpdater = (fn: UpdateFn) => {
  _update = fn
}

export const updateSession = (data: Record<string, unknown>) => {
  if (_update) {
    return _update(data)
  }
}
