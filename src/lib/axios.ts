import axios, { CanceledError, isAxiosError } from 'axios'

import { env } from '@/env'

import {
  endSession,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from './session'

declare module 'axios' {
  interface AxiosRequestConfig {
    // Set on the second attempt, so a request is retried only once
    retriedAfterRefresh?: boolean
  }
}

export const api = axios.create({
  baseURL: env.VITE_API_URL,
})

// They answer 401 for wrong input, not for an expired access token
const PUBLIC_ROUTES = ['/accounts', '/authenticate', '/refresh']

interface RefreshAccessTokenResponse {
  access_token: string
  expires_in: number
}

// Null means the session is over: there is no refresh token, or the API
// refused it (expired, or the user or store was deactivated). Any other
// failure, like the API being down, is thrown and keeps the session
async function requestAccessToken() {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    return null
  }

  try {
    const { data } = await api.post<RefreshAccessTokenResponse>('/refresh', {
      refreshToken,
    })

    setAccessToken(data.access_token)

    return data.access_token
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      endSession()
      return null
    }

    throw error
  }
}

let pendingRefresh: Promise<string | null> | null = null

// Requests that need a new token at the same time share a single refresh
function refreshAccessToken() {
  pendingRefresh ??= requestAccessToken().finally(() => {
    pendingRefresh = null
  })

  return pendingRefresh
}

api.interceptors.request.use(async (config) => {
  if (PUBLIC_ROUTES.includes(config.url ?? '')) {
    return config
  }

  // After a reload only the refresh token is left. Getting a new access token
  // first saves a request that would fail
  const accessToken =
    getAccessToken() ?? (getRefreshToken() ? await refreshAccessToken() : null)

  // Every other route needs a token, so without a session the API could only
  // answer 401
  if (!accessToken) {
    throw new CanceledError('There is no session', undefined, config)
  }

  config.headers.Authorization = `Bearer ${accessToken}`

  return config
})

api.interceptors.response.use(undefined, async (error) => {
  const request = isAxiosError(error) ? error.config : undefined

  if (
    !request ||
    error.response?.status !== 401 ||
    PUBLIC_ROUTES.includes(request.url ?? '') ||
    request.retriedAfterRefresh
  ) {
    throw error
  }

  const accessToken = await refreshAccessToken()

  if (!accessToken) {
    throw error
  }

  return api({ ...request, retriedAfterRefresh: true })
})
